class CompanyScopedMixin:
    """
    Filters querysets by company.
    Super Admin: sees all companies EXCEPT private ones (unless company_id param overrides).
    Boss/Staff: sees only their own company.
    """

    def get_company(self):
        user = self.request.user
        if hasattr(user, 'company'):
            return user.company
        return None

    def is_super_admin(self):
        return getattr(self.request.user, 'role', '') == "super_admin"

    def get_queryset(self):
        qs = super().get_queryset()

        if self.is_super_admin():
            # Check if a specific company_id is requested via query param
            company_id = self.request.query_params.get('company_id')
            if company_id:
                from apps.companies.models import Company
                try:
                    company = Company.objects.get(id=company_id)
                    # If company is private, block access
                    if company.is_private:
                        return qs.none()
                    return qs.filter(company=company)
                except Company.DoesNotExist:
                    return qs.none()
            # No company_id param — show all non-private companies
            from apps.companies.models import Company
            private_ids = list(
                Company.objects.filter(is_private=True).values_list('id', flat=True)
            )
            if private_ids:
                return qs.exclude(company_id__in=private_ids)
            return qs

        # Boss/Staff — filter by their own company only
        company = self.get_company()
        if company:
            return qs.filter(company=company)
        return qs.none()

    def perform_create(self, serializer):
        company = self.get_company()
        serializer.save(company=company)

    def perform_update(self, serializer):
        serializer.save()