import React, {
  ChangeEventHandler,
  forwardRef,
  KeyboardEventHandler,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ICellEditorParams } from "ag-grid-community";
import { GridGroupDataItem, SizeQuantity } from "../../../types";
import { ICellEditor } from "ag-grid-community/dist/lib/interfaces/iCellEditor";
import { afterFrame } from "../../../helpers/afterFrame";

const KEY = {
  BACKSPACE: "Backspace",
  DELETE: "Delete",
  ENTER: "Enter",
  TAB: "Tab",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
};

const isLeftOrRight = (key: string) =>
  [KEY.ARROW_LEFT, KEY.ARROW_RIGHT].indexOf(key) > -1;

const isUpOrDown = (key: string) =>
  [KEY.ARROW_UP, KEY.ARROW_DOWN].indexOf(key) > -1;

const isCharNumeric = (charStr: string) => !!/\d/.test(charStr);

const isKeyPressedNumeric = (key: string) => isCharNumeric(key);

const deleteOrBackspace = (key: string) =>
  [KEY.DELETE, KEY.BACKSPACE].indexOf(key) > -1;

const finishedEditingPressed = (key: string) =>
  key === KEY.ENTER || key === KEY.TAB;

export const SizeQuantityEditor = forwardRef(function SizeQuantityEditor(
  props: CastProp<ICellEditorParams<GridGroupDataItem>, "value", SizeQuantity>,
  ref: Ref<Partial<ICellEditor>>
) {
  const [quantity, setQuantity] = useState(
    deleteOrBackspace(props.eventKey)
      ? null
      : isCharNumeric(props.charPress)
      ? +props.charPress
      : props.value.quantity
  );
  const refInput = useRef<HTMLInputElement>(null);

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const value = props.parseValue(e.target.value);
      if (typeof value === "number") {
        setQuantity(value);
      }
    },
    [props]
  );

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    (event) => {
      const { key } = event;
      if (isLeftOrRight(key) || deleteOrBackspace(key)) {
        event.stopPropagation();
        return;
      }

      if (
        !finishedEditingPressed(key) &&
        !isUpOrDown(key) &&
        !isKeyPressedNumeric(key)
      ) {
        if (event.preventDefault) event.preventDefault();
      }
    },
    []
  );

  useEffect(() => {
    afterFrame(() => {
      refInput.current?.focus();
      if (!isCharNumeric(props.charPress)) {
        refInput.current?.select();
      }
    });
  }, [props.charPress]);

  const cancelBeforeStart =
    props.charPress && "1234567890".indexOf(props.charPress) < 0;

  useImperativeHandle(ref, () => ({
    getValue() {
      const cellValue: SizeQuantity = {
        ...props.value,
        quantity,
      };
      return cellValue;
    },
    focusIn() {
      refInput.current?.focus();
    },
    isCancelBeforeStart() {
      return cancelBeforeStart;
    },
    isCancelAfterEnd() {
      return quantity < 0 || quantity > 1000000;
    },
  }));

  return (
    <div className="quantity-editor">
      <input
        ref={refInput}
        type="number"
        min={0}
        value={quantity === null ? "" : quantity}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
});
