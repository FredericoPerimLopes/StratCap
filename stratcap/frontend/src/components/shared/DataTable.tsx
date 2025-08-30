import React, { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Checkbox,
  Typography,
  Toolbar,
  alpha,
  styled,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  GetApp as ExportIcon,
} from '@mui/icons-material';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
}));

const StyledTableHead = styled(TableHead)(() => ({
  '& .MuiTableCell-head': {
    backgroundColor: '#f8fafc',
    fontWeight: 600,
    fontSize: '0.875rem',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
  },
}));

const StyledTableCell = styled(TableCell)(() => ({
  borderBottom: '1px solid #f3f4f6',
  padding: '12px 16px',
  fontSize: '0.875rem',
}));

const StyledToolbar = styled(Toolbar)<{ numselected: number }>(({ theme, numselected }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(1),
  ...(numselected > 0 && {
    bgcolor: alpha(theme.palette.primary.main, 0.12),
  }),
}));

export interface Column<T = any> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  format?: (value: any, row: T) => React.ReactNode;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  onRowClick?: (row: T) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: () => void;
  onExport?: (data: T[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  totalCount?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  actions?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  selectable = false,
  onSelectionChange,
  onRowClick,
  onSort,
  onFilter,
  onExport,
  loading = false,
  emptyMessage = 'No data available',
  pageSize = 25,
  totalCount,
  page = 0,
  onPageChange,
  onPageSizeChange,
  actions,
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<T[]>([]);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const numSelected = selected.length;
  const rowCount = data.length;

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(data);
      onSelectionChange?.(data);
    } else {
      setSelected([]);
      onSelectionChange?.([]);
    }
  };

  const handleRowClick = (row: T) => {
    if (selectable) {
      const selectedIndex = selected.findIndex((item) => item === row);
      let newSelected: T[] = [];

      if (selectedIndex === -1) {
        newSelected = [...selected, row];
      } else if (selectedIndex === 0) {
        newSelected = selected.slice(1);
      } else if (selectedIndex === selected.length - 1) {
        newSelected = selected.slice(0, -1);
      } else if (selectedIndex > 0) {
        newSelected = [
          ...selected.slice(0, selectedIndex),
          ...selected.slice(selectedIndex + 1),
        ];
      }

      setSelected(newSelected);
      onSelectionChange?.(newSelected);
    } else {
      onRowClick?.(row);
    }
  };

  const handleSort = (column: string) => {
    const isAsc = sortColumn === column && sortDirection === 'asc';
    const direction = isAsc ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(direction);
    onSort?.(column, direction);
  };

  const isSelected = (row: T) => selected.findIndex((item) => item === row) !== -1;

  const displayData = useMemo(() => {
    if (loading) return [];
    return data;
  }, [data, loading]);

  const TableToolbar = () => {
    return (
      <StyledToolbar numselected={numSelected}>
        {numSelected > 0 ? (
          <Typography
            sx={{ flex: '1 1 100%' }}
            color="inherit"
            variant="subtitle1"
            component="div"
          >
            {numSelected} selected
          </Typography>
        ) : (
          <Typography
            sx={{ flex: '1 1 100%' }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            {title}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          {actions}
          {onFilter && (
            <Tooltip title="Filter list">
              <IconButton onClick={onFilter}>
                <FilterIcon />
              </IconButton>
            </Tooltip>
          )}
          {onExport && (
            <Tooltip title="Export data">
              <IconButton onClick={() => onExport(selected.length > 0 ? selected : data)}>
                <ExportIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </StyledToolbar>
    );
  };

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      {(title || numSelected > 0 || actions || onFilter || onExport) && <TableToolbar />}
      <StyledTableContainer>
        <Table stickyHeader>
          <StyledTableHead>
            <TableRow>
              {selectable && (
                <StyledTableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={numSelected > 0 && numSelected < rowCount}
                    checked={rowCount > 0 && numSelected === rowCount}
                    onChange={handleSelectAllClick}
                  />
                </StyledTableCell>
              )}
              {columns.map((column) => (
                <StyledTableCell
                  key={String(column.id)}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortColumn === column.id}
                      direction={sortColumn === column.id ? sortDirection : 'asc'}
                      onClick={() => handleSort(String(column.id))}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </StyledTableCell>
              ))}
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <StyledTableCell colSpan={columns.length + (selectable ? 1 : 0)} align="center">
                  Loading...
                </StyledTableCell>
              </TableRow>
            ) : displayData.length === 0 ? (
              <TableRow>
                <StyledTableCell colSpan={columns.length + (selectable ? 1 : 0)} align="center">
                  {emptyMessage}
                </StyledTableCell>
              </TableRow>
            ) : (
              displayData.map((row, index) => {
                const isItemSelected = isSelected(row);
                return (
                  <TableRow
                    hover
                    onClick={() => handleRowClick(row)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={index}
                    selected={isItemSelected}
                    sx={{ cursor: onRowClick || selectable ? 'pointer' : 'default' }}
                  >
                    {selectable && (
                      <StyledTableCell padding="checkbox">
                        <Checkbox color="primary" checked={isItemSelected} />
                      </StyledTableCell>
                    )}
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <StyledTableCell key={String(column.id)} align={column.align}>
                          {column.render
                            ? column.render(value, row)
                            : column.format
                            ? column.format(value, row)
                            : value}
                        </StyledTableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>
      {(totalCount !== undefined || data.length > pageSize) && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount || data.length}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={(_, newPage) => onPageChange?.(newPage)}
          onRowsPerPageChange={(event) =>
            onPageSizeChange?.(parseInt(event.target.value, 10))
          }
        />
      )}
    </Paper>
  );
}

export default DataTable;