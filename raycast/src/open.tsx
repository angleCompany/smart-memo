import { open, showHUD } from "@raycast/api";

export default async function Command() {
  await open("smartmemo://open");
  await showHUD("Smart Memo 열림");
}
