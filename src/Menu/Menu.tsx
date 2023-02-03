import React, {
    ButtonHTMLAttributes,
    Key,
    ReactElement,
    useLayoutEffect,
    useRef,
} from "react";
import { AriaMenuProps, MenuTriggerProps } from "@react-types/menu";
import { useMenuTriggerState } from "@react-stately/menu";
import { useTreeState } from "@react-stately/tree";
import { useButton } from "@react-aria/button";
import { FocusScope, useFocusRing } from "@react-aria/focus";
import { useMenu, useMenuItem, useMenuTrigger } from "@react-aria/menu";
import { useOverlayPosition } from "@react-aria/overlays";
import { mergeProps } from "@react-aria/utils";
import { Popover } from "../Popover";
import { useFocusableRef, useUnwrapDOMRef } from "@react-spectrum/utils";
import { useToggleState } from '@react-stately/toggle';
import {
    FocusableRef,
    FocusStrategy,
    DOMRefValue,
    Node
} from "@react-types/shared";
import { TreeState } from "@react-stately/tree";
import styles from "./Menu.module.css";
import clsx from "clsx";
import { useHover, useKeyboard } from "@react-aria/interactions";
import { Item } from "./";

export type SapphireMenuProps<T extends object> = AriaMenuProps<T> &
    MenuTriggerProps & {
        isSubMenu: boolean,
        setSelectedParentMenu: (val: boolean) => void,
        parentId: string,
        renderTrigger: (
            props: ButtonHTMLAttributes<Element>,
            isOpen: boolean,
        ) => React.ReactNode;
    };

interface MenuItemProps<T> {
    item: Node<T>;
    state: TreeState<T>;
    onAction?: (key: Key) => void;
    onClose: () => void;
    disabledKeys?: Iterable<Key>;
    isSubMenu: boolean,
    setSelectedParentMenu: (val: boolean) => void,
    parentId: string
}

export function MenuItem<T>({
    item,
    state,
    onAction,
    disabledKeys,
    onClose,
    isSubMenu,
    setSelectedParentMenu,
    parentId
}: MenuItemProps<T>): JSX.Element {
    const ref = React.useRef<HTMLLIElement>(null);
    const isDisabled = disabledKeys && [...disabledKeys].includes(item.key);

    const { menuItemProps } = useMenuItem(
        {
            key: item.key,
            isDisabled,
            onAction: item.hasChildNodes ? () => {
                setSelected(true);
            } : (e) => {
                onAction && onAction(e);
            },
            onClose: item.hasChildNodes ? () => {} : () => {
                onClose && onClose();
            }
        },
        state,
        ref
    );

    const { hoverProps, isHovered } = useHover({ isDisabled });
    const { focusProps, isFocusVisible } = useFocusRing();

    const { isSelected, setSelected } = useToggleState();
    const { keyboardProps } = useKeyboard({
        onKeyUp: (e) => {
            if (item.hasChildNodes && (e.keyCode === 39 || e.keyCode === 13)) {
                setSelected(true);
                setTimeout(() => {
                    const ele = document.getElementById(item.props.children[0].props.children)
                    ele?.focus()
                    if (ref && ref.current) {
                        ref.current.blur();
                    }
                }, 0)
            } else if (isSubMenu && e.keyCode === 37) {
                setSelectedParentMenu(false)
                const ele = document.getElementById(parentId)
                ele?.focus()
            }
        }
    });

    return (
        <li
            {...mergeProps(menuItemProps, hoverProps, focusProps, keyboardProps)}
            ref={ref}
            className={clsx(
                styles["sapphire-menu-item"],
                styles["js-focus"],
                styles["js-hover"],
                {
                    [styles["is-disabled"]]: isDisabled,
                    [styles["is-focus"]]: isFocusVisible,
                    [styles["is-hover"]]: isHovered
                }
            )}
            id={String(item.key)}
        >
            {item.hasChildNodes ?
                <Menu
                    renderTrigger={(props, a) => {
                        return (
                            <p {...props} style={{ width: "100%" }} className={styles["sapphire-menu-item-overflow"]}>
                                {item.rendered}
                                <span style={{ float: "right" }}>-&gt;</span>
                            </p>
                        )
                    }}
                    onAction={alert}
                    isOpen={isSelected}
                    isSubMenu={true}
                    setSelectedParentMenu={setSelected}
                    parentId={String(item.key)}
                >
                    {item.props.children.map((ele: any) => <Item key={ele.props.children}>{ele.props.children}</Item>)}
                </Menu> :
                <p className={styles["sapphire-menu-item-overflow"]}>{item.rendered}</p>
            }
        </li>
    );
}

const MenuPopup = <T extends object>(
    props: {
        autoFocus: FocusStrategy;
        onClose: () => void;
        isSubMenu: boolean,
        setSelectedParentMenu: (val: boolean) => void,
        parentId: string
    } & SapphireMenuProps<T>
) => {
    const state = useTreeState({ ...props, selectionMode: "none" });
    const menuRef = useRef<HTMLUListElement>(null);
    const { menuProps } = useMenu(props, state, menuRef);

    return (
        <ul {...menuProps} ref={menuRef} className={styles["sapphire-menu"]}>
            {[...state.collection].map((item) => {
                if (item.type === "section") {
                    throw new Error("Sections not supported");
                }
                return (
                    <MenuItem
                        key={item.key}
                        item={item}
                        state={state}
                        onClose={props.onClose}
                        onAction={props.onAction}
                        disabledKeys={props.disabledKeys}
                        isSubMenu={props.isSubMenu}
                        setSelectedParentMenu={props.setSelectedParentMenu}
                        parentId={props.parentId}
                    />
                );
            })}
        </ul>
    );
};

function _Menu<T extends object>(
    props: SapphireMenuProps<T>,
    ref: FocusableRef<HTMLButtonElement>
) {
    const { renderTrigger, shouldFlip = true, isSubMenu = false, setSelectedParentMenu, parentId } = props;

    const state = useMenuTriggerState(props);
    const triggerRef = useFocusableRef<HTMLButtonElement>(ref);
    const popoverRef = useRef<DOMRefValue<HTMLDivElement>>(null);
    const unwrappedPopoverRef = useUnwrapDOMRef(popoverRef);
    const { menuTriggerProps, menuProps } = useMenuTrigger(
        props,
        state,
        triggerRef
    );
    const { buttonProps } = useButton(menuTriggerProps, triggerRef);

    const { overlayProps, updatePosition } = useOverlayPosition({
        targetRef: triggerRef,
        overlayRef: unwrappedPopoverRef,
        isOpen: state.isOpen,
        placement: isSubMenu ? "right top" : "bottom start",
        offset: 6,
        onClose: state.close,
        shouldFlip
    });

    // Fixes an issue where menu with controlled open state opens in wrong place the first time
    useLayoutEffect(() => {
        if (state.isOpen) {
            requestAnimationFrame(() => {
                updatePosition();
            });
        }
    }, [state.isOpen, updatePosition]);

    return (
        <>
            {renderTrigger({ ref: triggerRef, ...buttonProps }, state.isOpen)}
            <Popover
                isOpen={state.isOpen}
                ref={popoverRef}
                style={overlayProps.style}
                className={clsx(styles["sapphire-menu-container"])}
                shouldCloseOnBlur
                onClose={() => {
                    if (isSubMenu) setSelectedParentMenu(false)
                    state.close()
                }}
            >
                <FocusScope>
                    <MenuPopup
                        {...mergeProps(props, menuProps)}
                        autoFocus={state.focusStrategy || true}
                        onClose={state.close}
                        isSubMenu={isSubMenu}
                        setSelectedParentMenu={setSelectedParentMenu}
                        parentId={parentId}
                    />
                </FocusScope>
            </Popover>
        </>
    );
}

export const Menu = React.forwardRef(_Menu) as <T extends object>(
    props: SapphireMenuProps<T>,
    ref: FocusableRef<HTMLButtonElement>
) => ReactElement;
