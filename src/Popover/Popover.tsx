import React, {
    ForwardedRef,
    forwardRef,
    HTMLAttributes,
    CSSProperties
  } from "react";
  import { useDOMRef } from "@react-spectrum/utils";
  import { useObjectRef } from "@react-aria/utils";
  import { DOMRef } from "@react-types/shared";
  import { mergeProps } from "@react-aria/utils";
  import { PopoverProps as AriaPopoverProps } from "@react-types/overlays";
  import { useModal, useOverlay, OverlayContainer } from "@react-aria/overlays";
  
  type PopoverProps = Omit<AriaPopoverProps, "arrowProps" | "hideArrow"> & {
    className?: string;
    style: CSSProperties | undefined;
  };
  
  /**
   * Popovers are containers used to display transient content such as
   * menus, options, additional actions etc.
   * Intended for internal use within Sapphire in components like Select and Menu.
   */
  function Popover(props: PopoverProps, ref: DOMRef<HTMLDivElement>) {
    const {
      children,
      placement,
      onClose,
      shouldCloseOnBlur,
      isKeyboardDismissDisabled,
      isNonModal,
      isDismissable = true,
      isOpen,
      className,
      style
    } = props;
    const domRef = useDOMRef(ref);
    if (!isOpen) {
      return null;
    }
    return (
      <OverlayContainer>
        <PopoverWrapper
          className={className}
          style={style}
          ref={domRef}
          placement={placement}
          onClose={onClose}
          shouldCloseOnBlur={shouldCloseOnBlur}
          isKeyboardDismissDisabled={isKeyboardDismissDisabled}
          isNonModal={isNonModal}
          isDismissable={isDismissable}
          isOpen={isOpen}
        >
          {children}
        </PopoverWrapper>
      </OverlayContainer>
    );
  }
  
  const PopoverWrapper = forwardRef(function PopoverWrapper(
    props: PopoverProps & HTMLAttributes<HTMLElement>,
    forwardedRef: ForwardedRef<HTMLDivElement>
  ) {
    const {
      children,
      isOpen,
      isNonModal,
      isDismissable,
      shouldCloseOnBlur,
      isKeyboardDismissDisabled,
      ...otherProps
    } = props;
    const ref = useObjectRef(forwardedRef);
    const { overlayProps } = useOverlay(
      { ...props, isDismissable: isDismissable && isOpen },
      ref
    );
    const { modalProps } = useModal({
      isDisabled: isNonModal
    });
  
    return (
      <div
        {...mergeProps(otherProps, overlayProps, modalProps)}
        ref={ref}
        role="presentation"
        data-testid="popover"
      >
        {children}
      </div>
    );
  });
  
  const _Popover = forwardRef(Popover);
  export { _Popover as Popover };
  