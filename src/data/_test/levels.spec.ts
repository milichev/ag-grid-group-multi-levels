/** __@jest-environment jsdom */

import { getLevelMeta } from "../levels";
import { ShipmentsMode } from "../types";

describe("levels", () => {
  describe("getLevelMeta", () => {
    it("should downgrade products in flatten-size", () => {
      expect(
        getLevelMeta(
          [],
          "product",
          {},
          {
            shipmentsMode: ShipmentsMode.BuildOrder,
            isFlattenSizes: true,
          }
        )
      ).toEqual({
        checked: true,
        downEnabled: false,
        upEnabled: false,
        enabled: false,
      });
    });
  });
});
