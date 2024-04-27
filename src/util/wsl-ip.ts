import { execSync } from "child_process";

export function wslIp() {
  return execSync(
    "ip addr show eth0 | grep -oP '(?<=inet\\s)\\d+(\\.\\d+){3}'"
  ).toString();
}
