try:
    import gevent.monkey

    gevent.monkey.patch_all()
except ImportError:
    pass
import multiprocessing

bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "gevent"
worker_connections = 1000

# Additional settings for Socket.IO
keepalive = 2
timeout = 120  # WebSocket connections stay alive for real-time streaming
graceful_timeout = 30  # shutdown timeout for Socket.IO connections
