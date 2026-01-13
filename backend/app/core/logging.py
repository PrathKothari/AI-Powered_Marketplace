import logging
import sys

def setup_logging():
    """
    Configure the logging for the application.
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)]
    )
    # TODO: Add more sophisticated logging (e.g., JSON formatting, file rotation)
