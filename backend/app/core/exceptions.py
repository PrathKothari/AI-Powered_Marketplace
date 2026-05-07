class AppBaseException(Exception):
    """Base exception for the application"""
    pass

class ResourceNotFoundException(AppBaseException):
    """Requested resource was not found"""
    pass

class PermissionDeniedException(AppBaseException):
    """User does not have permission"""
    pass
