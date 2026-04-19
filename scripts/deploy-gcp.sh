#!/usr/bin/env bash

set -euo pipefail

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI is required."
  exit 1
fi

PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE="${GCP_CLOUD_RUN_SERVICE:-trovia-app}"
REPOSITORY="${GCP_ARTIFACT_REPOSITORY:-trovia}"
IMAGE_NAME="${GCP_IMAGE_NAME:-trovia-app}"
TAG="${GCP_IMAGE_TAG:-latest}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Set GCP_PROJECT_ID before running this script."
  exit 1
fi

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${TAG}"

echo "Deploying Trovia to Cloud Run..."
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE}"
echo "Image: ${IMAGE_URI}"

gcloud builds submit \
  --project "${PROJECT_ID}" \
  --config cloudbuild.yaml \
  --substitutions "_SERVICE=${SERVICE},_REGION=${REGION},_IMAGE_URI=${IMAGE_URI}"
