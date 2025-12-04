import json
import subprocess
import os
import boto3
from botocore.exceptions import ClientError


AWS_PROFILE = "default"
AWS_REGION = "us-west-2"
SECRET_NAME = "dev/.env"
ENV_OUTPUT_FILE = ".env"


def fetch_secret():
    """Fetch a Secrets Manager secret using the logged-in AWS SSO session."""
    print("🔎 Fetching secret from AWS…")

    session = boto3.Session(profile_name=AWS_PROFILE)
    client = session.client("secretsmanager", region_name=AWS_REGION)

    try:
        response = client.get_secret_value(SecretId=SECRET_NAME)
        secret_string = response["SecretString"]
        return json.loads(secret_string)
    except ClientError as e:
        print("ERROR fetching secret:", e)
        exit(1)


def write_env_file(data):
    """Writes key/value pairs to a .env file."""
    print(f"📝 Writing {ENV_OUTPUT_FILE}…")

    with open(ENV_OUTPUT_FILE, "w") as f:
        for key, value in data.items():
            f.write(f'{key}="{value}"\n')

    print(f"✅ Successfully created {ENV_OUTPUT_FILE}")


def main():
    print("=== ENV IMPORT SCRIPT ===")

    secret_data = fetch_secret()
    write_env_file(secret_data)

    print("\n Done! Your .env file is ready.\n")


if __name__ == "__main__":
    main()
