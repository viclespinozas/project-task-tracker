#!/usr/bin/env python3
"""
Test script for compute_past_due function directly.
"""

from app.services.task_service import compute_past_due
from datetime import date

def test_compute_past_due():
    """Test the compute_past_due function directly."""
    
    print("Testing compute_past_due function...")
    
    # Test 1: Past due task (due date in past, status not DONE)
    result = compute_past_due('2020-01-01', 'active')
    print(f"Test 1 - Past due task: {result} (expected: True)")
    assert result == True
    
    # Test 2: Future due task (due date in future, status not DONE)
    result = compute_past_due('2030-01-01', 'active')
    print(f"Test 2 - Future due task: {result} (expected: False)")
    assert result == False
    
    # Test 3: Past due task with status DONE
    result = compute_past_due('2020-01-01', 'Done')
    print(f"Test 3 - Past due task with DONE status: {result} (expected: False)")
    assert result == False
    
    # Test 4: No due date
    result = compute_past_due(None, 'active')
    print(f"Test 4 - No due date: {result} (expected: False)")
    assert result == False
    
    # Test 5: String date parsing
    result = compute_past_due('2020-12-31', 'active')
    print(f"Test 5 - String date parsing: {result} (expected: True)")
    assert result == True
    
    # Test 6: Date object input
    result = compute_past_due(date(2020, 1, 1), 'active')
    print(f"Test 6 - Date object input: {result} (expected: True)")
    assert result == True
    
    print("All tests passed!")

if __name__ == "__main__":
    test_compute_past_due()