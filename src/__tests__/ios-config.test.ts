import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const IOS_APP_DIR = resolve(__dirname, "../../ios/App/App");

function readFile(name: string): string {
  const path = resolve(IOS_APP_DIR, name);
  expect(existsSync(path), `${name} doit exister`).toBe(true);
  return readFileSync(path, "utf-8");
}

describe("iOS Config - Privacy Manifest (PrivacyInfo.xcprivacy)", () => {
  it("existe et est un XML valide", () => {
    const content = readFile("PrivacyInfo.xcprivacy");
    expect(content).toContain("<?xml");
    expect(content).toContain("<plist");
  });

  it("declare NSPrivacyTracking a false (pas de tracking)", () => {
    const content = readFile("PrivacyInfo.xcprivacy");
    expect(content).toContain("<key>NSPrivacyTracking</key>");
    expect(content).toMatch(
      /<key>NSPrivacyTracking<\/key>\s*<false\/>/
    );
  });

  it("declare les API accedees (UserDefaults, SystemBootTime, FileTimestamp)", () => {
    const content = readFile("PrivacyInfo.xcprivacy");
    expect(content).toContain("NSPrivacyAccessedAPICategoryUserDefaults");
    expect(content).toContain("NSPrivacyAccessedAPICategorySystemBootTime");
    expect(content).toContain("NSPrivacyAccessedAPICategoryFileTimestamp");
  });

  it("ne collecte pas de donnees pour le tracking", () => {
    const content = readFile("PrivacyInfo.xcprivacy");
    expect(content).toContain("<key>NSPrivacyTrackingDomains</key>");
    expect(content).toMatch(
      /<key>NSPrivacyTrackingDomains<\/key>\s*<array\/>/
    );
    expect(content).toContain("<key>NSPrivacyCollectedDataTypes</key>");
    expect(content).toMatch(
      /<key>NSPrivacyCollectedDataTypes<\/key>\s*<array\/>/
    );
  });
});

describe("iOS Config - App.entitlements", () => {
  it("existe et est un XML valide", () => {
    const content = readFile("App.entitlements");
    expect(content).toContain("<?xml");
    expect(content).toContain("<plist");
  });

  it("configure aps-environment en production", () => {
    const content = readFile("App.entitlements");
    expect(content).toContain("<key>aps-environment</key>");
    expect(content).toMatch(
      /<key>aps-environment<\/key>\s*<string>production<\/string>/
    );
  });

  it("configure les associated domains pour squadplanner.fr", () => {
    const content = readFile("App.entitlements");
    expect(content).toContain(
      "<key>com.apple.developer.associated-domains</key>"
    );
    expect(content).toContain("applinks:squadplanner.fr");
    expect(content).toContain("webcredentials:squadplanner.fr");
  });
});

describe("iOS Config - Info.plist permissions", () => {
  it("existe et est un XML valide", () => {
    const content = readFile("Info.plist");
    expect(content).toContain("<?xml");
    expect(content).toContain("<plist");
  });

  it("declare la permission micro avec la bonne description", () => {
    const content = readFile("Info.plist");
    expect(content).toContain("<key>NSMicrophoneUsageDescription</key>");
    expect(content).toContain("chat vocal Party");
  });

  it("declare la permission camera avec la bonne description", () => {
    const content = readFile("Info.plist");
    expect(content).toContain("<key>NSCameraUsageDescription</key>");
    expect(content).toContain("avatar");
  });

  it("ne declare PAS NSUserTrackingUsageDescription (pas de tracking)", () => {
    const content = readFile("Info.plist");
    expect(content).not.toContain("NSUserTrackingUsageDescription");
  });

  it("a le bon bundle identifier", () => {
    const content = readFile("Info.plist");
    expect(content).toContain("$(PRODUCT_BUNDLE_IDENTIFIER)");
  });
});

describe("iOS Config - project.pbxproj references", () => {
  it("reference PrivacyInfo.xcprivacy", () => {
    const pbxproj = readFileSync(
      resolve(IOS_APP_DIR, "../App.xcodeproj/project.pbxproj"),
      "utf-8"
    );
    expect(pbxproj).toContain("PrivacyInfo.xcprivacy");
    expect(pbxproj).toContain("PrivacyInfo.xcprivacy in Resources");
  });

  it("reference App.entitlements", () => {
    const pbxproj = readFileSync(
      resolve(IOS_APP_DIR, "../App.xcodeproj/project.pbxproj"),
      "utf-8"
    );
    expect(pbxproj).toContain("App.entitlements");
    expect(pbxproj).toContain("CODE_SIGN_ENTITLEMENTS = App/App.entitlements");
  });
});
