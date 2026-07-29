class CompanyScopedMixin:
    """
    Add to any ViewSet to automatically:
    - filter querysets to request.user.company
    - stamp new objects with request.user.company
    Super admins (no company) see everything.
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