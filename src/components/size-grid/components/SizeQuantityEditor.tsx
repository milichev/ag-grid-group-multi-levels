import React, {
  ChangeEventHandler,
  forwardRef,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ICellEditorParams } from "ag-grid-community";
import { GridGroupDataItem, SizeQuantity } from "../../../interfaces";
import { ICellEditor } from "ag-grid-community/dist/lib/interfaces/iCellEditor";
import { afterFrame } from "../../../helpers/afterFrame";

const KEY_BACKSPACE = "Backspace";
const KEY_DELETE = "Delete";
const KEY_ENTER = "Enter";
const KEY_TAB = "Tab";

const isLeftOrRight = (event: any) => {
  return ["ArrowLeft", "ArrowRight"].indexOf(event.key) > -1;
};

const isUpOrDown = (event: any) => {
  return ["ArrowUp", "ArrowDown"].indexOf(event.key) > -1;
};

const isCharNumeric = (charStr: string) => {
  return !!/\d/.test(charStr);
};

const isKeyPressedNumeric = (event: any) => {
  const charStr = event.key;
  return isCharNumeric(charStr);
};

const deleteOrBackspace = (event: any) => {
  return [KEY_DELETE, KEY_BACKSPACE].indexOf(event.key) > -1;
};

const finishedEditingPressed = (event: any) => {
  const key = event.key;
  return key === KEY_ENTER || key === KEY_TAB;
};

export const SizeQuantityEditor = forwardRef(function SizeQuantityEditor(
  props: CastProp<ICellEditorParams<GridGroupDataItem>, "value", SizeQuantity>,
  ref
) {
  const [quantity, setQuantity] = useState(props.value.quantity);
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
    (event: any) => {
      if (isLeftOrRight(event) || deleteOrBackspace(event)) {
        event.stopPropagation();
        return;
      }

      if (
        !finishedEditingPressed(event) &&
        !isUpOrDown(event) &&
        !isKeyPressedNumeric(event)
      ) {
        if (event.preventDefault) event.preventDefault();
      }
    },
    []
  );

  useEffect(() => {
    // get ref from React component
    afterFrame(() => {
      refInput.current?.focus();
      refInput.current?.select();
    });
  }, []);

  const cancelBeforeStart =
    props.charPress && "1234567890".indexOf(props.charPress) < 0;

  useImperativeHandle(ref, () => {
    const handle: Partial<ICellEditor> = {
      getValue() {
        const cellValue: SizeQuantity = {
          ...props.value,
          quantity,
        };
        return cellValue;
      },
      isCancelBeforeStart() {
        return cancelBeforeStart;
      },
      focusIn() {
        refInput.current?.focus();
      },
      isCancelAfterEnd() {
        return quantity < 0 || quantity > 1000000;
      },
    };
    return handle;
  });

  return (
    <div className="quantity-editor">
      <input
        ref={refInput}
        type="number"
        min={0}
        value={quantity}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
});
