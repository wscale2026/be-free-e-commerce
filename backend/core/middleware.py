import re

# Regex matching any private LAN IP address ranges
_LAN_ORIGIN_RE = re.compile(
    r'^http://(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$'
)


class LocalNetworkCsrfMiddleware:
    """
    Development-only middleware that dynamically trusts CSRF origins
    from any private LAN IP address (192.168.x.x, 10.x.x.x, 172.16-31.x.x).

    This avoids having to hardcode each machine's IP in CSRF_TRUSTED_ORIGINS.
    Do NOT use in production.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.META.get('HTTP_ORIGIN', '')
        if origin and _LAN_ORIGIN_RE.match(origin):
            # Inject the origin into CSRF_TRUSTED_ORIGINS dynamically
            from django.conf import settings
            if origin not in getattr(settings, 'CSRF_TRUSTED_ORIGINS', []):
                if not isinstance(settings.CSRF_TRUSTED_ORIGINS, list):
                    settings.CSRF_TRUSTED_ORIGINS = list(settings.CSRF_TRUSTED_ORIGINS)
                settings.CSRF_TRUSTED_ORIGINS.append(origin)

        return self.get_response(request)
