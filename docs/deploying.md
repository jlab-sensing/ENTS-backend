

#### Database (Postgres)

We use [Postgresql](https://www.postgresql.org/) as the database for the ENTS backend. The fields `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_DATABASE` should be filled out with the appropriate values. The `DB_PORT` should be set to `5432` as this is the default port for Postgresql. The following SQL commands can be used to create a new database and user where `'password'` is replaced with a secure randomly generated password.

```sql
CREATE DATABASE dirtviz;
CREATE ROLE dirtviz WITH NOLOGIN PASSWORD 'password';
```

#### Public URL

The `PUBLIC_URL` is the domain alias that the website is hosted on. This is used to generate links in the website and should be set to the domain that the website is hosted on. For local development, this can be set to `http://localhost:3000/`.

#### Google

The Google API key is used to enable logins with Google accounts. Navigate to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project or select the existing one associate with the website. Goto the _Google Auth Platform > Clients_ and create a new client. The client ID and secret can be found in the client details and are populated in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

The `OAUTH_REDIRECT_URI` is the URI that Google will redirect to after a successful login. This should be set to the homepage of the hosted website, in our publicly hosted instance this is set to `https://dirtviz.jlab.ucsc.edu/auth/callback`. Ensure the domain is authorized in the Google Cloud Console. For local development, this can be set to `http://localhost:3000/auth/callback`.

#### Flask Secrets

To generate a secret key for the `SECRET_KEY`, `REFRESH_TOKEN_SECRET`, and `ACCESS_TOKEN_SECRET` variables, run the following _three separate times_ in a python shell:

```
>>> import secrets
>>> secrets.token_urlsafe(16)
'LcbUf00Qnh5r-TXDNJML0g'
```

<!-- for reference OLD -->
