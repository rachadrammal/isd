import os
import sys
import pytest

# Ensure repo root is on sys.path so "backend" can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app import app  # now works in CI/CD

def test_app_exists():
    """Basic sanity check: app object is defined"""
    assert app is not None