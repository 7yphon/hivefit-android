# Releasing HiveFit for Android

Every tag that matches `v*` builds a signed AAB, creates a GitHub release, and, once the one-time setup below is done, uploads the AAB to the Google Play **production** track with a full rollout. There is no manual step between tagging and Play.

The release workflow runs on GitHub, so release tags must be pushed to the `github` remote (`7yphon/hivefit-android`). The `origin` remote is Codeberg and does not run the workflow.

## How a release works

1. Bump `versionCode` (a whole number, must go up on every upload) and `versionName` in `android/app/build.gradle`.
2. Update `distribution/whatsnew/whatsnew-en-US`. Plain words, under 500 characters, user-facing benefits only (no CI, build or internal changes).
3. Commit, and merge to `main`.
4. Tag and push the tag to the GitHub remote:
   ```
   git tag vX.Y.Z
   git push github vX.Y.Z
   ```
5. The `Build & Release` workflow in `.github/workflows/release.yml` builds, signs and creates the GitHub release. If the `PLAY_SERVICE_ACCOUNT_JSON` secret exists, the last step uploads the AAB to Play production. If the secret is missing, that step is skipped and the release still completes.

Things to know:

- Play rejects an upload whose `versionCode` is not higher than the last one. Bump it every time.
- Google reviews each production release before it reaches users. The upload succeeding does not mean the update is live yet.
- To stop a bad release, open the app in Play Console and halt the rollout on the production track. (Menu names may differ slightly in the current console; not verified.)
- A brand-new app must have had at least one upload to an earlier track (internal testing, for example) before Play accepts a production upload. If the first Play upload fails with a precondition error, upload one build to internal testing by hand, then tag again.

## One-time owner setup (Play service account)

Do this once. It needs no code changes.

a. Open the Google Cloud console (https://console.cloud.google.com). Create a project, or pick an existing one. Then go to APIs and Services, Library, search for "Google Play Android Developer API", and enable it.

b. Go to IAM and Admin, Service Accounts, and click Create service account. Open the new account, go to Keys, click Add key, then Create new key, choose JSON, and download the file. Keep this file private. Never commit it or paste it anywhere except the GitHub secret in step d. Delete your local copy after step d.

c. Open Play Console, Setup, API access. Link the Google Cloud project if it is not linked yet. Find the service account (its email ends in `iam.gserviceaccount.com`) and click Grant access. Give it access to this app with these permissions:
   - "Release to production, exclude devices, and use Play App Signing"
   - "Release apps to testing tracks"
   Alternatively, use Users and permissions, Invite new users, and enter the service account email. The exact wording of the permission labels was not checked against the live console.

d. Open the GitHub repo (`7yphon/hivefit-android`), go to Settings, Secrets and variables, Actions, and click New repository secret. Name it `PLAY_SERVICE_ACCOUNT_JSON` and paste the whole JSON file contents.

e. One service account can serve both apps. Grant it access to each app in Play Console (or account-wide if you prefer), and add the same secret to each GitHub repo.

After this, the next tag push uploads to Play production automatically.
