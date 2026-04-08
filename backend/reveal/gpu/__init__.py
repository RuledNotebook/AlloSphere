"""GPU resource management for Reveal inference."""

from reveal.gpu.batch_manager import BatchManager, VramBudget

__all__ = ["BatchManager", "VramBudget"]
