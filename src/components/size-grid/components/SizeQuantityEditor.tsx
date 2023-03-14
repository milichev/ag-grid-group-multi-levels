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
import { ICellEditor, ICellEditorParams, KeyCode } from "ag-grid-community";
import { GridGroupDataItem, SizeQuantity } from "../../../data/types";
import { WithSizeGridEntities } from "../types";
import { afterFrame } from "../../../helpers/afterFrame";

const isLeftOrRight = (key: string) =>
  [KeyCode.LEFT, KeyCode.RIGHT].indexOf(key) > -1;

const isUpOrDown = (key: string) =>
  [KeyCode.UP, KeyCode.DOWN].indexOf(key) > -1;

const isCharNumeric = (charStr: string) => !!/\d/.test(charStr);

const isKeyPressedNumeric = (key: string) => isCharNumeric(key);

const deleteOrBackspace = (key: string) =>
  [KeyCode.DELETE, KeyCode.BACKSPACE].indexOf(key) > -1;

const finishedEditingPressed = (key: string) =>
  key === KeyCode.ENTER || key === KeyCode.TAB;

export const SizeQuantityEditor = forwardRef(function SizeQuantityEditor(
  props: CastProp<
    WithSizeGridEntities<ICellEditorParams<GridGroupDataItem>>,
    "value",
    SizeQuantity
  >,
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
    props.charPress && !"1234567890".includes(props.charPress);

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
