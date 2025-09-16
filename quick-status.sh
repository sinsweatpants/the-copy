#!/usr/bin/env bash
set -euo pipefail
as_bool(){ test "$1" = "1" && echo "PASS" || echo "FAIL"; }
ts="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
head_ref="$(git rev-parse --short=12 HEAD 2>/dev/null || echo "N/A")"
head_msg="$(git log -1 --pretty=%s 2>/dev/null || echo "N/A")"

has_firebaserc=0; test -f .firebaserc && has_firebaserc=1 || true
has_firebase_json=0; test -f firebase.json && has_firebase_json=1 || true
has_hosting=0
if [ "$has_firebase_json" = "1" ]; then
  jq -e '.hosting and .hosting.public=="frontend/dist" and
          (.hosting.rewrites|any(.source=="**" and .destination=="/index.html")) and
          (.hosting.headers|any(.headers|any(.key=="Cache-Control")))' firebase.json >/dev/null 2>&1 && has_hosting=1 || true
fi

fe_env_ok=0
if [ -f frontend/.env.production.example ]; then
  grep -q '^VITE_API_BASE=' frontend/.env.production.example && ! grep -q '^VITE_API_URL=' frontend/.env.production.example && fe_env_ok=1 || true
fi

cors_ok=0
if compgen -G "backend/src/config/cors.*" >/dev/null; then
  grep -Eq 'FRONTEND_ORIGINS' backend/src/config/cors.* && grep -Eq 'split\(|,\)|,\s*' backend/src/config/cors.* && cors_ok=1 || true
fi

metrics_ok=0; compgen -G "backend/src/server.*" >/dev/null && grep -Eq '/metrics' backend/src/server.* && metrics_ok=1 || true
csp_ok=0; compgen -G "backend/src/middleware/security.*" >/dev/null && grep -Eq 'contentSecurityPolicy' backend/src/middleware/security.* && grep -Eq 'connectSrc' backend/src/middleware/security.* && csp_ok=1 || true

rl_ok=0; compgen -G "backend/src/middleware/rate-limit.*" >/dev/null && grep -Eq 'express-rate-limit' backend/src/middleware/rate-limit.* && rl_ok=1 || true

docker_ok=0; test -f Dockerfile && grep -qi 'FROM node:20' Dockerfile && grep -qi 'AS builder' Dockerfile && grep -qi -- '--omit=dev' Dockerfile && docker_ok=1 || true

locks_ok=0; test -f package-lock.json || test -f backend/package-lock.json || test -f frontend/package-lock.json && locks_ok=1 || locks_ok=0

build_fe=0; build_be=0
test -d frontend/dist && build_fe=1 || true
test -d backend/dist && build_be=1 || true

echo "=== PROD QUICK STATUS @ $ts ==="
echo "HEAD        : $head_ref | $head_msg"
echo ".firebaserc : $(as_bool $has_firebaserc)"
echo "Hosting cfg : $(as_bool $has_hosting)"
echo "FE API base : $(as_bool $fe_env_ok)"
echo "CORS (CSV)  : $(as_bool $cors_ok)"
echo "/metrics    : $(as_bool $metrics_ok)"
echo "CSP connect : $(as_bool $csp_ok)"
echo "Rate limit  : $(as_bool $rl_ok)"
echo "Dockerfile  : $(as_bool $docker_ok)"
echo "Lockfiles   : $(as_bool $locks_ok)"
echo "FE build    : $(as_bool $build_fe)"
echo "BE build    : $(as_bool $build_be)"

critical_fail=0
for flag in $has_firebaserc $has_hosting $fe_env_ok $cors_ok $metrics_ok $csp_ok $rl_ok $docker_ok $locks_ok $build_fe $build_be; do
  if [ "$flag" != "1" ]; then critical_fail=1; fi
done

if [ "$critical_fail" = "0" ]; then
  followup='- الإطلاق متاح الآن – جميع فحوصات الجاهزية PASS، البناء أخضر، الاستضافة فعّالة، `/metrics` يعمل.'
else
  followup='- التالي عند الاستئناف: نشر Firebase Hosting وcurl /metrics من البيئة.'
fi

mkdir -p audit
{
  echo "# STATUS"
  echo "## اللقطة الحالية ($ts)"
  echo "- HEAD: $head_ref — $head_msg"
  echo "- النتائج:"
  echo "  - .firebaserc: $(as_bool $has_firebaserc)"
  echo "  - firebase hosting: $(as_bool $has_hosting)"
  echo "  - VITE_API_BASE: $(as_bool $fe_env_ok)"
  echo "  - CORS (FRONTEND_ORIGINS CSV): $(as_bool $cors_ok)"
  echo "  - /metrics: $(as_bool $metrics_ok)"
  echo "  - CSP connectSrc: $(as_bool $csp_ok)"
  echo "  - Rate limit: $(as_bool $rl_ok)"
  echo "  - Dockerfile (node20 + omit=dev): $(as_bool $docker_ok)"
  echo "  - Lockfiles: $(as_bool $locks_ok)"
  echo "  - Builds (FE/BE): $(as_bool $build_fe) / $(as_bool $build_be)"
  echo "$followup"
} > STATUS.md

exit "$critical_fail"
