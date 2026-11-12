# Quickstart

This Quickstart guide explains how to get started with a local instance of the ENTS Backend.

## Prerequisites

- A computer running Windows, macOS, or Linux that can stay powered on with a stable internet connection.
- A network that supports IoT devices. Enterprise networks that require a username and password or a login portal (such as eduroam) will not work.
- Docker with Docker Compose v2 (see [Installing Docker](#installing-docker) below).

## Network Forwarding Address

In this guide, you will need your computer's local IP address. Your ENTS board uses it in Step 4 to send data to your local server. To find it, follow the section below for your operating system (Windows, macOS, or Linux).

### Finding your IP address on Windows

1. Open Windows PowerShell.
2. Run `ipconfig`.
3. Look under your active connection (Wireless LAN adapter Wi-Fi or Ethernet adapter) for the line labeled IPv4 Address.
    - This usually starts with `192.168.`
4. Keep note of this IP address.

### Finding your IP address on macOS

1. Open a terminal.
2. Run `ipconfig getifaddr en0`.
    - If that does not work, use `ipconfig getifaddr en1`.
3. Keep note of this IP address.

### Finding your IP address on Linux

1. Open a terminal.
2. Run `ip addr`.
3. Look for the `inet` line under your active network interface (for example `eth0` or `wlan0`).
4. Keep note of this IP address.

## Installing Docker

The ENTS Backend runs entirely in Docker containers, so Docker (with Docker Compose v2) is the only thing you need to install to run it.

### Check if Docker is already installed

Open a terminal (PowerShell on Windows) and run:

```bash
docker --version
docker compose version
```

If both commands print a version number (Compose should be **v2.x or newer**), skip to [Verify Docker works](#verify-docker-works).
If you get `command not found` / `not recognized`, or only `docker-compose` (with a hyphen) works, follow the steps for your OS below.

### Installing Docker on Windows

1. Make sure virtualization is enabled. In PowerShell, run `wsl --install` (restart if prompted). Docker Desktop uses WSL 2 to run containers.
2. Download and run [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/).
3. When asked, keep **Use WSL 2 instead of Hyper-V** checked.
4. Restart your computer, then open Docker Desktop and wait until it shows **Engine running**.
5. In Docker Desktop, go to **Settings → General** and enable **Start Docker Desktop when you sign in**.

### Installing Docker on macOS

1. Check your chip: Apple menu → **About This Mac** (Apple Silicon = M1/M2/M3/…, otherwise Intel).
2. Download the matching [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/) installer.
3. Open the `.dmg` and drag Docker into Applications, then launch it and wait until it shows **Engine running**.
4. In **Settings → General**, enable **Start Docker Desktop when you sign in**.

### Installing Docker on Linux

1. Follow the official [Docker Engine install guide](https://docs.docker.com/engine/install/) for your distribution (Ubuntu, Debian, Fedora, etc.). This installs Docker Compose v2 as the `docker-compose-plugin` package.
2. Let your user run Docker without `sudo`, then log out and back in:

    ```bash
    sudo usermod -aG docker $USER
    ```

3. Have Docker start on boot:

    ```bash
    sudo systemctl enable --now docker
    ```

### Verify Docker works

Run:

```bash
docker run hello-world
```

You should see `Hello from Docker!`. If you instead get an error like `Cannot connect to the Docker daemon`, Docker isn't running: open Docker Desktop (Windows/macOS) or run `sudo systemctl start docker` (Linux).

## 1. Setting the .env variables

The backend reads its configuration from a `.env` file in the root of the repository.

1. In a terminal in the repository's root directory, copy the example file:

    ```bash
    # macOS / Linux
    cp .env.example .env
    ```

    ```powershell
    # Windows PowerShell
    Copy-Item .env.example .env
    ```

2. Open `.env` in a text editor and fill in the values below.

### Google OAuth credentials

Logging in to the web interface uses Google accounts, and you need to be logged in to create cells and loggers. You must create your own Google OAuth credentials in the [Google Cloud Console](https://console.cloud.google.com/):

1. Create a new project (or select an existing one).
2. Go to **Google Auth Platform → Clients** and create a new **Web application** client.
3. Under **Authorized redirect URIs**, add `http://localhost:3000/auth/callback`.
4. Copy the client ID and client secret into `.env`:

    ```bash
    GOOGLE_CLIENT_ID=<your client ID>
    GOOGLE_CLIENT_SECRET=<your client secret>
    OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
    ```

5. If your app's audience is set to **Testing**, add the Google account(s) you will log in with under **Google Auth Platform → Audience → Test users**.

See [deploying.md](./deploying.md) for more detail on these values.

### Secret keys

`SECRET_KEY`, `REFRESH_TOKEN_SECRET`, and `ACCESS_TOKEN_SECRET` sign users' logins. The example values will work, but they are public in this repository, and your server will be reachable by other devices on your network. Replace each one with a newly generated value. You can generate one using Docker, so you don't need Python installed:

```bash
docker run --rm python:3-alpine python -c "import secrets; print(secrets.token_urlsafe(16))"
```

Run it three times and paste a different value into each of the three variables.

### Values to leave as-is

- **Database (`DB_*`)**: keep the example values. They must match the database settings in `docker-compose.yml`.
- **`CONFIG_TYPE`** and **`PUBLIC_URL`**: keep the example values.
- **The Things Network (`TTN_*`)**: leave these blank. They are only used for LoRaWAN, and a local instance only supports uploading over WiFi.

## 2. Run the project

In a terminal, navigate to the repository's root directory and run:

```bash
docker compose up -d
```

The project should run in background Docker containers on your machine.

## 3. Access the Web Interface

To access the web interface:

1. In a web browser, go to [http://localhost:3000](http://localhost:3000).
    - You should see a local version of the DirtViz website. After logging in, you can create cells and loggers from the profile page.

## 4. Uploading to local instance of ENTS-Backend

To upload data from ENTS boards to your local instance of the ENTS backend, you need an initialized board (see [this guide](https://github.com/jlab-sensing/ENTS-node-firmware/blob/main/docs/quickstart.md)) and your computer's local IP address (from [Network Forwarding Address](#network-forwarding-address)).

While setting up the board, enable WiFi communication only, set the network SSID and password to the same network that your local ENTS-Backend is connected to, and set the API Endpoint URL to:

```text
http://<YOUR LOCAL IP ADDRESS>:3000/api/sensor/
```

### Allow port 3000 through your firewall

Your board connects to your computer on port 3000. If your firewall blocks incoming connections, the board will fail to upload even though the web interface works on your computer.

- **Windows**: If Windows asks whether to allow Docker Desktop on your network, allow it. Otherwise, run this in PowerShell **as Administrator**:

    ```powershell
    New-NetFirewallRule -DisplayName "ENTS Backend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
    ```

    Also make sure your WiFi network is set to **Private**, not Public (**Settings → Network & internet → Wi-Fi → your network**).
- **macOS**: Go to **System Settings → Network → Firewall**. If the firewall is on, click **Options** and allow incoming connections for Docker.
- **Linux**: If you use `ufw`, run `sudo ufw allow 3000/tcp`.

## 5. Stopping and restarting

To stop the backend:

```bash
docker compose down
```

Your data is kept in a Docker volume and will still be there the next time you start the backend. **Do not** add `-v` (`docker compose down -v`), because that deletes the database.

The containers do not start again automatically after your computer restarts. After a reboot, make sure Docker is running, then start the backend again from the repository's root directory:

```bash
docker compose up -d
```

To check which containers are running:

```bash
docker compose ps
```
