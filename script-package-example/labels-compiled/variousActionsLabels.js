"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// labels/variousActionsLabels.ts
var variousActionsLabels_exports = {};
__export(variousActionsLabels_exports, {
  aliceTalkMenuLabel: () => aliceTalkMenuLabel,
  talkAliceQuest: () => talkAliceQuest
});
module.exports = __toCommonJS(variousActionsLabels_exports);
var import_nqtr = require("@drincs/nqtr");
var import_pixi_vn = require("@drincs/pixi-vn");

// labels/variousActionsLabelKeys.ts
var TALK_ALICE_QUEST_KEY = "talkAliceQuest";
var ALICE_TALK_MENU_LABEL_KEY = "AliceTalkMenuLabel";

// labels/variousActionsLabels.ts
var aliceQuest = import_nqtr.RegisteredQuests.get("aliceQuest");
var alice = import_pixi_vn.RegisteredCharacters.get("alice");
var mc = import_pixi_vn.RegisteredCharacters.get("mc");
var talkAliceQuest = (0, import_pixi_vn.newLabel)(
  TALK_ALICE_QUEST_KEY,
  () => {
    if (!aliceQuest) {
      return [
        () => {
          import_pixi_vn.narration.dialogue = { text: "Quest not found" };
        }
      ];
    }
    if (aliceQuest.currentStageIndex == 0) {
      return [
        async () => {
          import_pixi_vn.narration.dialogue = { character: alice, text: "Hi, can you order me a new book from pc?" };
        },
        () => {
          import_pixi_vn.narration.dialogue = { character: alice, text: "Ok" };
        },
        () => {
          import_pixi_vn.narration.dialogue = { character: alice, text: "Thanks" };
        },
        (props) => {
          aliceQuest.goNext(props);
          import_pixi_vn.narration.goNext(props);
        }
      ];
    } else if (aliceQuest.currentStageIndex == 1) {
      return [
        async () => {
          import_pixi_vn.narration.dialogue = { character: mc, text: "What book do you want me to order?" };
        },
        () => {
          import_pixi_vn.narration.dialogue = { character: alice, text: "For me it is the same." };
        }
      ];
    } else if (aliceQuest.currentStageIndex == 2) {
      return [
        async () => {
          import_pixi_vn.narration.dialogue = { character: mc, text: "I ordered the Book, hope you enjoy it." };
        },
        () => {
          import_pixi_vn.narration.dialogue = {
            character: alice,
            text: "Great, when it arrives remember to bring it to me."
          };
        }
      ];
    } else if (aliceQuest.currentStageIndex == 3) {
      return [
        async () => {
          import_pixi_vn.narration.dialogue = { character: mc, text: "Here's your book." };
        },
        () => {
          import_pixi_vn.narration.dialogue = { character: alice, text: "Thank you, I can finally read something new." };
        },
        (props) => {
          aliceQuest.goNext(props);
          import_pixi_vn.narration.goNext(props);
        }
      ];
    }
    return [
      () => {
        import_pixi_vn.narration.dialogue = { character: alice, text: "Thanks for the book." };
      }
    ];
  },
  {
    onStepStart: async (stepIndex) => {
      if (stepIndex == 0) {
        await (0, import_pixi_vn.showImage)(BACKGROUND_ID, "alice_terrace0At");
      }
    }
  }
);
var aliceTalkMenuLabel = (0, import_pixi_vn.newLabel)(ALICE_TALK_MENU_LABEL_KEY, [
  async () => {
    await (0, import_pixi_vn.showImage)(BACKGROUND_ID, "alice_terrace0At");
    import_pixi_vn.narration.dialogue = { character: alice, text: "Hi, what do you want to talk about?" };
    const optionsMenu = [];
    if (aliceQuest && aliceQuest.started) {
      optionsMenu.push((0, import_pixi_vn.newChoiceOption)("About the book", talkAliceQuest, {}));
    }
    import_pixi_vn.narration.choiceMenuOptions = [...optionsMenu, (0, import_pixi_vn.newCloseChoiceOption)("Cancel")];
  }
]);
