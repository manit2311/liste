class CompanyScopedMixin:
    """
    Filters querysets to request.user.company.
    Super admins see all UNLESS a company is marked is_private=True.
    """

    def get_company(self):
        user = self.request.user
        if hasattr(user, 'company'):
            return user.company
        return None

    def is_super_admin(self):
        return self.request.user.role == "super_admin"

    def get_queryset(self):
        qs = super().get_queryset()
        if self.is_super_admin():
            # Super admin sees all companies EXCEPT private ones
            # Exclude data from companies that set is_private=True
            from apps.companies.models import Company
            private_companies = Company.objects.filter(is_private=True).values_list('id', flat=True)
            if private_companies:
                return qs.exclude(company_id__in=private_companies)
            return qs
        company = self.get_company()
        if company:
            return qs.filter(company=company)
        return qs.none()

    def perform_create(self, serializer):
        company = self.get_company()
        serializer.save(company=company)

    def perform_update(self, serializer):
        serializer.save()