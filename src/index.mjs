/*
 * Copyright 2025 - 2026 Zigflow authors <https://github.com/zigflow/setup-zigflow/graphs/contributors>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import fs from 'fs';
import path from 'path';

// Maps GitHub Actions runner values to Zigflow platform strings
function getPlatform() {
  switch (process.platform) {
    case 'linux':
      return 'linux';
    case 'darwin':
      return 'darwin';
    case 'win32':
      return 'windows';
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

// Maps Node.js arch values to Zigflow arch strings
function getArch() {
  switch (process.arch) {
    case 'x64':
      return 'x86_64';
    case 'arm64':
      return 'arm64';
    default:
      throw new Error(`Unsupported architecture: ${process.arch}`);
  }
}

async function resolveVersion(requestedVersion) {
  if (requestedVersion !== 'latest') {
    return requestedVersion;
  }

  const res = await fetch(
    'https://github.com/zigflow/zigflow/releases/latest',
    { redirect: 'manual' },
  );
  const location = res.headers.get('location');
  if (!location) {
    throw new Error('Could not resolve latest Zigflow release from GitHub');
  }
  return location.split('/').pop().replace(/^v/, '');
}

async function run() {
  try {
    const requestedVersion = core.getInput('version', { required: true });
    const token = core.getInput('token');

    const platform = getPlatform();
    const arch = getArch();
    const version = await resolveVersion(requestedVersion, token);

    core.info(`Setting up Zigflow CLI v${version} (${platform}/${arch})`);

    // Check the tool cache first — avoids re-downloading on self-hosted runners
    // or when the action is called multiple times in a workflow
    let toolDir = tc.find('zigflow', version, arch);

    if (toolDir) {
      core.info(`Found cached Zigflow v${version} at ${toolDir}`);
    } else {
      const binaryName =
        platform === 'windows'
          ? `zigflow_${platform}_${arch}.exe`
          : `zigflow_${platform}_${arch}`;

      const downloadUrl =
        `https://github.com/zigflow/zigflow/releases/download/` +
        `v${version}/${binaryName}`;

      core.info(`Downloading from ${downloadUrl}`);
      const downloadPath = await tc.downloadTool(downloadUrl);

      // Cache the single binary file (not a directory) under the tool name
      // so future steps/jobs can find it via tc.find()
      const destName = platform === 'windows' ? 'zigflow.exe' : 'zigflow';
      toolDir = await tc.cacheFile(
        downloadPath,
        destName,
        'zigflow',
        version,
        arch,
      );

      // Make executable on Unix
      if (platform !== 'windows') {
        fs.chmodSync(path.join(toolDir, destName), '755');
      }
    }

    // Add the tool directory to PATH so `zigflow` works in subsequent steps
    core.addPath(toolDir);
    core.setOutput('version', version);
    core.info(`Zigflow CLI v${version} is ready`);
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
