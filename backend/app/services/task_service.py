from datetime import date, datetime
from typing import Optional


def compute_past_due(due_date: Optional[date], status: Optional[str]) -> bool:
    """
    Compute if a task is past due based on due date and status.
    
    A task is considered past due if:
    - The due_date is before today AND 
    - The status is not 'DONE'
    
    Args:
        due_date: The due date of the task (can be date or datetime object or string)
        status: The current status of the task
        
    Returns:
        bool: True if the task is past due, False otherwise
    """
    # If no due date or status is done, it's not past due
    if not due_date or status == "DONE":
        return False
    
    # Convert string to date if needed
    if isinstance(due_date, str):
        # Parse the date string (assuming ISO format like "2023-12-31")
        try:
            due_date = datetime.fromisoformat(due_date).date()
        except ValueError:
            # If parsing fails, return False as we can't determine if it's past due
            return False
    
    # Check if due date is before today
    return due_date < date.today()
