# Quickstart

This Quickstart guide explains how to get started with a local instance of the ENTS Backend

## Prerequisites

- working machine that can remain on and powered with stable internet connection
- Network you are on can support IOT devices (not like eduroam)

- A computer running Windows, Linux, or MacOS.

## Network Forwarding Address
In this guide, you will be required to find your local ip address. To do that, follow the corresponding sections below for windows or macos

### Windows
1. Open windows powershell
2. Run `ipconfig`
3. Look under your active connection (Wireless LAN adapter WIFI or Ethernet adapter) for the line labeled IPv4 address. 
    - This should start with 192.168.
4. Keep note of this IP address

### MacOS
1. Open a terminal
2. Run `ipconfig getifaddr en0`
    - If that does not work, use `ipconfig getifaddr en1`
3. Keep note of this IP address

### Linux
1. Open a terminal
2. Type `ip addr`
3. Look for the inet line under your active network interface (eth0 or wlan0)
4. Keep note of this IP address

## Installing Docker

The ENTS Backend runs entirely in Docker containers, so Docker (with Docker Compose v2) is the only thing you need to install to run it.

### Check if Docker is already installed
Open a terminal (PowerShell on Windows) and run:

    docker --version
    docker compose version

If both commands print a version number (Compose should be **v2.x or newer**), skip to [Verify Docker works](#verify-docker-works).
If you get `command not found` / `not recognized`, or only `docker-compose` (with a hyphen) works, follow the steps for your OS below.

### Windows
1. Make sure virtualization is enabled. In PowerShell, run `wsl --install` (restart if prompted). Docker Desktop uses WSL 2 to run containers.
2. Download and run [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/).
3. When asked, keep **Use WSL 2 instead of Hyper-V** checked.
4. Restart your computer, then open Docker Desktop and wait until it shows **Engine running**.
5. In Docker Desktop, go to **Settings → General** and enable **Start Docker Desktop when you sign in**.

### MacOS
1. Check your chip: Apple menu → **About This Mac** (Apple Silicon = M1/M2/M3/…, otherwise Intel).
2. Download the matching [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/) installer.
3. Open the `.dmg` and drag Docker into Applications, then launch it and wait until it shows **Engine running**.
4. In **Settings → General**, enable **Start Docker Desktop when you sign in**.

### Linux
1. Follow the official [Docker Engine install guide](https://docs.docker.com/engine/install/) for your distribution (Ubuntu, Debian, Fedora, etc.). This installs Docker Compose v2 as the `docker-compose-plugin` package.
2. Let your user run Docker without `sudo`:

       sudo usermod -aG docker $USER

   Then log out and back in.
3. Have Docker start on boot:

       sudo systemctl enable --now docker

### Verify Docker works
Run:

    docker run hello-world

You should see `Hello from Docker!`. If you instead get an error like `Cannot connect to the Docker daemon`, Docker isn't running: open Docker Desktop (Windows/macOS) or run `sudo systemctl start docker` (Linux).

## 1. Setting the .env variables




## 2. Run the project

In a terminal, navigate to the repositories directory and run:

        docker compose up -d

The project should run in a background docker container on your machine. 

## 3. Access the Web Interface

To access the web interface: 
1. Using a web browser, search localhost:3000
    - You should be able to access a local interface of the DirtViz website. From here, you can create cells and loggers in the profile page. 

## 4. Uploading to local instance of ENTS-Backend

To upload data from ENTS boards to your local instance of the ENTS backend, you must have an initialized board (follow (this guide for instructions)[https://github.com/jlab-sensing/ENTS-node-firmware/blob/main/docs/quickstart.md] and your ENTS-Backend Local IP address)

While setting up the board, enable WiFi communication only, set the network SSID and password to the same as the network that your local ENTS-Backend is connected to, and set the API Endpoint URL to https://[YOUR LOCAL IP ADDRESS HERE]:3000/api/sensor/



