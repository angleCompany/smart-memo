/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `capture-clipboard` command */
  export type CaptureClipboard = ExtensionPreferences & {}
  /** Preferences accessible in the `capture-url` command */
  export type CaptureUrl = ExtensionPreferences & {}
  /** Preferences accessible in the `open` command */
  export type Open = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `capture-clipboard` command */
  export type CaptureClipboard = {}
  /** Arguments passed to the `capture-url` command */
  export type CaptureUrl = {}
  /** Arguments passed to the `open` command */
  export type Open = {}
}

