import React from 'react';
import { TextInput as PaperTextInput, TextInputProps } from 'react-native-paper';
import { useThemeContext } from '../../context/ThemeContext';

export interface ThemedTextInputProps extends TextInputProps {
    customBorderColor?: string;
    onChangeText?: (text: string) => void;
}

export const ThemedTextInput: React.FC<ThemedTextInputProps> & {
    Icon: typeof PaperTextInput.Icon;
    Affix: typeof PaperTextInput.Affix;
} = (props) => {
    const { theme } = useThemeContext();
    const { style, mode = "outlined", ...rest } = props;

    return (
        <PaperTextInput
            mode={mode}
            textColor={theme.textPrimary}
            placeholderTextColor={theme.textSecondary}
            outlineColor={props.customBorderColor || theme.border}
            activeOutlineColor={theme.accent}
            selectionColor={theme.accent}
            theme={{
                colors: {
                    onSurfaceVariant: theme.textSecondary,
                    background: theme.bgDark,
                    surfaceVariant: theme.bgDark,
                    outline: props.customBorderColor || theme.border,
                    primary: theme.accent,
                }
            }}
            style={[
                {
                    backgroundColor: theme.bgDark,
                    fontSize: 14,
                },
                style
            ]}
            {...rest}
        />
    );
};

ThemedTextInput.Icon = PaperTextInput.Icon;
ThemedTextInput.Affix = PaperTextInput.Affix;

