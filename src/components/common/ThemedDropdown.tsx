import React from 'react';
import { Dropdown } from 'react-native-element-dropdown';
import { useThemeContext } from '../../context/ThemeContext';

interface ThemedDropdownProps {
    data: any[];
    labelField?: string;
    valueField?: string;
    placeholder?: string;
    value: any;
    onChange: (item: any) => void;
    disable?: boolean;
    style?: any;
    dropdownPosition?: 'auto' | 'top' | 'bottom';
    search?: boolean;
    searchPlaceholder?: string;
    renderLeftIcon?: () => React.ReactElement | null;
    maxHeight?: number;
    [key: string]: any;
}

export const ThemedDropdown: React.FC<ThemedDropdownProps> = ({
    data,
    labelField = 'label',
    valueField = 'value',
    placeholder = 'Select an option',
    value,
    onChange,
    disable = false,
    style,
    dropdownPosition = 'auto',
    search = false,
    searchPlaceholder = 'Search...',
    renderLeftIcon,
    ...rest
}) => {
    const { theme } = useThemeContext();

    return (
        <Dropdown
            {...rest}
            data={data}
            labelField={labelField}
            valueField={valueField}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disable={disable}
            dropdownPosition={dropdownPosition}
            search={search}
            searchPlaceholder={searchPlaceholder}
            renderLeftIcon={renderLeftIcon}
            activeColor={theme.bgDark}
            style={[
                {
                    height: 50,
                    backgroundColor: theme.bgDark,
                    borderColor: theme.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    marginBottom: 10,
                },
                style,
            ]}
            placeholderStyle={{
                color: theme.textSecondary,
                fontSize: 14,
            }}
            selectedTextStyle={{
                color: theme.textPrimary,
                fontSize: 14,
                fontWeight: '500',
            }}
            inputSearchStyle={{
                color: theme.textPrimary,
                backgroundColor: theme.bgDark,
                borderColor: theme.border,
                borderRadius: 6,
                fontSize: 14,
            }}
            containerStyle={{
                backgroundColor: theme.bgSurface,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 8,
                overflow: 'hidden',
            }}
            itemTextStyle={{
                color: theme.textPrimary,
                fontSize: 14,
            }}
            itemContainerStyle={{
                backgroundColor: theme.bgSurface,
            }}
        />
    );
};
