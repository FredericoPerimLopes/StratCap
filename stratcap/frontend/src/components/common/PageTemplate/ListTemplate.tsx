import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  TextField,
  InputAdornment,
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

export interface TableColumn {
  id: string;
  label: string;
  sortable?: boolean;
  width?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => React.ReactNode;
}

export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'contained' | 'outlined' | 'text';
  startIcon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'error';
}

export interface ListTemplateProps {
  title: string;
  subtitle?: string;
  searchable?: boolean;
  filterable?: boolean;
  actions?: ActionButton[];
  data: any[];
  columns: TableColumn[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  renderRowActions?: (row: any) => React.ReactNode;
}

export const ListTemplate: React.FC<ListTemplateProps> = ({
  title,
  subtitle,
  searchable = true,
  filterable = true,
  actions = [],
  data,
  columns,
  loading,
  emptyMessage = 'No data available',
  onRowClick,
  renderRowActions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const filteredData = data.filter((row) =>
    searchTerm === '' || 
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h1" color="text.primary" gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body1" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={2} sx={{ mt: { xs: 2, sm: 0 } }}>
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'contained'}
                color={action.color || 'primary'}
                startIcon={action.startIcon}
                onClick={action.onClick}
                size="small"
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        </Stack>

        {/* Search and Filters */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          {searchable && (
            <TextField
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: { xs: 'auto', sm: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="disabled" />
                  </InputAdornment>
                ),
              }}
            />
          )}
          {filterable && (
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
              size="small"
            >
              Filters
            </Button>
          )}
        </Stack>
      </Box>

      {/* Results Summary */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {filteredData.length} {filteredData.length === 1 ? 'result' : 'results'}
          {searchTerm && ` for "${searchTerm}"`}
        </Typography>
      </Box>

      {/* Data Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    style={{ width: column.width }}
                    sx={{ fontWeight: 600 }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                {renderRowActions && (
                  <TableCell align="right" sx={{ width: 100 }}>
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                // Loading skeleton rows
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.id}>
                        <Box sx={{ height: 20, bgcolor: 'grey.100', borderRadius: 1 }} />
                      </TableCell>
                    ))}
                    {renderRowActions && (
                      <TableCell align="right">
                        <Box sx={{ height: 20, width: 60, bgcolor: 'grey.100', borderRadius: 1 }} />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (renderRowActions ? 1 : 0)}
                    align="center"
                    sx={{ py: 6 }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={index}
                    hover={!!onRowClick}
                    onClick={() => onRowClick?.(row)}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align || 'left'}
                      >
                        {column.format
                          ? column.format(row[column.id])
                          : row[column.id]
                        }
                      </TableCell>
                    ))}
                    {renderRowActions && (
                      <TableCell align="right">
                        {renderRowActions(row)}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Filter Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>All Items</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Active</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Inactive</MenuItem>
      </Menu>
    </Container>
  );
};

export default ListTemplate;