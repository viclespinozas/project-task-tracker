from datetime import date
from typing import Optional


def compute_past_due(due_date: Optional[date], status: Optional[str]) -> bool:
    """
    Compute if a task is past due based on due date and status.
    
    A task is considered past due if:
    - The due_date is before today AND 
    - The status is not 'DONE'
    
    Args:
        due_date: The due date of the task
        status: The current status of the task
        
    Returns:
        bool: True if the task is past due, False otherwise
    """
    # If no due date or status is done, it's not past due
    if not due_date or status == "DONE":
        return False
    
    # Check if due date is before today
    return due_date < date.today()