#!/usr/bin/env python3
"""
NICOLAS OS launcher.

Starts a tiny local web server for the dashboard and opens it in your browser.
This is what the desktop "Nicolas OS.exe" runs. It serves the LIVE repo folder,
so any edits you make to config.js show up immediately.

Run directly:  python launch_nicolas_os.py
"""
import os
import sys
import time
import socket
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 8787  # fixed so your saved data (localStorage) persists across launches


def find_root():
    """Locate the Personal-OS folder (the one containing index.html)."""
    here = os.path.dirname(os.path.abspath(sys.argv[0]))
    candidates = [
        r"C:\Users\nicol\OneDrive\Documents\GitHub\Personal-OS",
        r"C:\Users\nicol\Documents\GitHub\Personal-OS",
        here,
    ]
    try:
        candidates.append(os.path.dirname(os.path.abspath(__file__)))
    except NameError:
        pass
    for c in candidates:
        if c and os.path.isfile(os.path.join(c, "index.html")):
            return c
    return None


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass  # keep the console clean


def port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0


def main():
    try:
        os.system("title NICOLAS OS")
    except Exception:
        pass

    url = "http://localhost:{}/index.html".format(PORT)

    # Already running? Just open it and exit.
    if port_in_use(PORT):
        print("NICOLAS OS is already running. Opening it...")
        webbrowser.open(url)
        time.sleep(1.2)
        return

    root = find_root()
    if not root:
        print("Could not find your Personal-OS folder.")
        print(r"Expected at: C:\Users\nicol\OneDrive\Documents\GitHub\Personal-OS")
        input("Press Enter to close...")
        return

    os.chdir(root)
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), QuietHandler)
    threading.Timer(0.7, lambda: webbrowser.open(url)).start()

    print("=" * 50)
    print("   NICOLAS OS is running")
    print("   " + url)
    print("   Keep this window open. Close it to quit.")
    print("=" * 50)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down. See you tonight.")


if __name__ == "__main__":
    main()
