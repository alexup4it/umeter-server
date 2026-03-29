'use client';

import { useCallback, useState } from 'react';

import { Box } from '@mantine/core';
import {
    DatePickerInput,
    type DatesRangeValue,
} from '@mantine/dates';

interface RangePickerProps {
    value: DatesRangeValue;
    onRangeChange: (value: DatesRangeValue) => void;
}

/**
 * Date range picker with local state.
 * Updates are pushed to parent only when the dropdown closes,
 * which fixes the issue where selecting the first date fires
 * onChange before the second date is set.
 */
export function RangePicker({
    value,
    onRangeChange,
}: RangePickerProps) {
    const [localValue, setLocalValue] = useState<DatesRangeValue>(
        value,
    );

    const handleDropdownClose = useCallback(() => {
        onRangeChange(localValue);
    }, [localValue, onRangeChange]);

    return (
        <Box maw={ 300 }>
            <DatePickerInput
                type="range"
                label="Date Range"
                placeholder="Pick dates range"
                allowSingleDateInRange
                clearable
                value={ localValue }
                onChange={ setLocalValue }
                onDropdownClose={ handleDropdownClose }
            />
        </Box>
    );
}
