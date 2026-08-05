class CompanyScopedMixin:
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
            # Super admin can filter by company via ?company_id= query param
            company_id = self.request.query_params.get('company_id')
            if company_id:
                from apps.companies.models import Company
                try:
                    company = Company.objects.get(id=company_id)
                    if company.is_private:
                        return qs.none()
                    return qs.filter(company=company)
                except Company.DoesNotExist:
                    return qs.none()
            # No filter = see all non-private companies
            from apps.companies.models import Company
            private_ids = Company.objects.filter(is_private=True).values_list('id', flat=True)
            return qs.exclude(company_id__in=private_ids)
        company = self.get_company()
        if company:
            return qs.filter(company=company)
        return qs.none()

    def perform_create(self, serializer):
        company = self.get_company()
        serializer.save(company=company)

    def perform_update(self, serializer):
        serializer.save()