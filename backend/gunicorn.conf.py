try:
    import gevent.monkey

    gevent.monkey.patch_all()
except ImportError:
    pass
import multiprocessing

bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
