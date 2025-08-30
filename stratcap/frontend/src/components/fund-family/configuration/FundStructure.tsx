import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon,
  AccountTree as TreeIcon,
  Business as BusinessIcon,
  Link as LinkIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface FundEntity {
  id: string;
  name: string;
  type: 'fund' | 'feeder' | 'master' | 'parallel' | 'blocker' | 'holding';
  jurisdiction: string;
  currency: string;
  status: 'active' | 'inactive' | 'liquidating';
  parentId?: string;
  order: number;
  settings: {
    managementFeeRate?: number;
    carriedInterestRate?: number;
    preferredReturn?: number;
  };
}

interface EntityRelationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationshipType: 'owns' | 'manages' | 'invests_in' | 'distributes_to';
  percentage?: number;
}

interface FundStructureProps {
  configuration: {
    entities: FundEntity[];
    relationships: EntityRelationship[];
    version: number;
  };
  onChange: (configuration: any) => void;
  fundFamilyId?: string;
}

// Draggable Entity Item Component
const SortableEntityItem: React.FC<{
  entity: FundEntity;
  onEdit: (entity: FundEntity) => void;
  onDelete: (id: string) => void;
  isChild?: boolean;
}> = ({ entity, onEdit, onDelete, isChild = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: entity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'fund': return 'primary';
      case 'feeder': return 'secondary';
      case 'master': return 'success';
      case 'parallel': return 'info';
      case 'blocker': return 'warning';
      case 'holding': return 'error';
      default: return 'default';
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'fund': return <BusinessIcon />;
      case 'feeder': return <ShareIcon />;
      case 'master': return <TreeIcon />;
      default: return <BusinessIcon />;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        ml: isChild ? 4 : 0,
        cursor: isDragging ? 'grabbing' : 'default',
        '&:hover': { boxShadow: 2 }
      }}
      variant={isChild ? 'outlined' : 'elevation'}
    >
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box {...attributes} {...listeners} sx={{ cursor: 'grab', mr: 2 }}>
            <DragIcon color="action" />
          </Box>
          
          <Box sx={{ mr: 2 }}>
            {getEntityIcon(entity.type)}
          </Box>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight="600">
                {entity.name}
              </Typography>
              <Chip 
                label={entity.type} 
                size="small" 
                color={getEntityTypeColor(entity.type) as any}
                variant="outlined"
              />
              <Chip 
                label={entity.status} 
                size="small" 
                color={entity.status === 'active' ? 'success' : 'default'}
                variant="filled"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {entity.jurisdiction} • {entity.currency}
            </Typography>
            {entity.settings.managementFeeRate && (
              <Typography variant="caption" color="text.secondary">
                Management Fee: {entity.settings.managementFeeRate}% • 
                Carried Interest: {entity.settings.carriedInterestRate}%
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Edit Entity">
              <IconButton size="small" onClick={() => onEdit(entity)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Entity">
              <IconButton 
                size="small" 
                color="error" 
                onClick={() => onDelete(entity.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const entityValidationSchema = Yup.object({
  name: Yup.string().required('Entity name is required').min(2, 'Name must be at least 2 characters'),
  type: Yup.string().required('Entity type is required'),
  jurisdiction: Yup.string().required('Jurisdiction is required'),
  currency: Yup.string().required('Currency is required'),
  status: Yup.string().required('Status is required')
});

const FundStructure: React.FC<FundStructureProps> = ({ configuration, onChange, fundFamilyId }) => {
  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<FundEntity | null>(null);
  const [relationshipDialogOpen, setRelationshipDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const entityFormik = useFormik({
    initialValues: {
      name: '',
      type: 'fund' as const,
      jurisdiction: 'Delaware',
      currency: 'USD',
      status: 'active' as const,
      parentId: '',
      settings: {
        managementFeeRate: 2,
        carriedInterestRate: 20,
        preferredReturn: 8
      }
    },
    validationSchema: entityValidationSchema,
    onSubmit: (values) => {
      const newEntity: FundEntity = {
        id: editingEntity?.id || `entity_${Date.now()}`,
        ...values,
        parentId: values.parentId || undefined,
        order: editingEntity?.order || configuration.entities.length
      };

      const updatedEntities = editingEntity
        ? configuration.entities.map(e => e.id === editingEntity.id ? newEntity : e)
        : [...configuration.entities, newEntity];

      onChange({
        ...configuration,
        entities: updatedEntities
      });

      setEntityDialogOpen(false);
      setEditingEntity(null);
      entityFormik.resetForm();
    }
  });

  const handleEditEntity = (entity: FundEntity) => {
    setEditingEntity(entity);
    entityFormik.setValues({
      name: entity.name,
      type: entity.type,
      jurisdiction: entity.jurisdiction,
      currency: entity.currency,
      status: entity.status,
      parentId: entity.parentId || '',
      settings: entity.settings
    });
    setEntityDialogOpen(true);
  };

  const handleDeleteEntity = (entityId: string) => {
    if (window.confirm('Are you sure you want to delete this entity?')) {
      const updatedEntities = configuration.entities.filter(e => e.id !== entityId);
      const updatedRelationships = configuration.relationships.filter(
        r => r.fromEntityId !== entityId && r.toEntityId !== entityId
      );

      onChange({
        ...configuration,
        entities: updatedEntities,
        relationships: updatedRelationships
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = configuration.entities.findIndex(e => e.id === active.id);
      const newIndex = configuration.entities.findIndex(e => e.id === over?.id);
      
      const reorderedEntities = arrayMove(configuration.entities, oldIndex, newIndex);
      
      onChange({
        ...configuration,
        entities: reorderedEntities.map((entity, index) => ({
          ...entity,
          order: index
        }))
      });
    }
  };

  const addNewEntity = () => {
    setEditingEntity(null);
    entityFormik.resetForm();
    setEntityDialogOpen(true);
  };

  // Group entities by hierarchy
  const entityHierarchy = useMemo(() => {
    const rootEntities = configuration.entities.filter(e => !e.parentId);
    const childEntities = configuration.entities.filter(e => e.parentId);
    
    return rootEntities.map(root => ({
      ...root,
      children: childEntities.filter(child => child.parentId === root.id)
    }));
  }, [configuration.entities]);

  const jurisdictions = ['Delaware', 'Cayman Islands', 'Luxembourg', 'Ireland', 'Singapore', 'Hong Kong'];
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight="600">
            Fund Structure Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Define the legal entity structure and relationships for this fund family
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={() => setRelationshipDialogOpen(true)}
            disabled={configuration.entities.length < 2}
          >
            Manage Relationships
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addNewEntity}
          >
            Add Entity
          </Button>
        </Box>
      </Box>

      {/* Structure Overview */}
      {configuration.entities.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {configuration.entities.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Entities
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary.main">
                  {configuration.relationships.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Relationships
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {configuration.entities.filter(e => e.status === 'active').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Entities
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {new Set(configuration.entities.map(e => e.jurisdiction)).size}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Jurisdictions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Entity List */}
      {configuration.entities.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
          <TreeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No entities configured
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add your first fund entity to start building the structure
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={addNewEntity}>
            Add First Entity
          </Button>
        </Paper>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={configuration.entities.map(e => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <Box>
              {entityHierarchy.map((entity) => (
                <Box key={entity.id}>
                  <SortableEntityItem
                    entity={entity}
                    onEdit={handleEditEntity}
                    onDelete={handleDeleteEntity}
                  />
                  {entity.children && entity.children.map(child => (
                    <SortableEntityItem
                      key={child.id}
                      entity={child}
                      onEdit={handleEditEntity}
                      onDelete={handleDeleteEntity}
                      isChild={true}
                    />
                  ))}
                </Box>
              ))}
            </Box>
          </SortableContext>
        </DndContext>
      )}

      {/* Entity Dialog */}
      <Dialog 
        open={entityDialogOpen} 
        onClose={() => {
          setEntityDialogOpen(false);
          setEditingEntity(null);
          entityFormik.resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingEntity ? 'Edit Entity' : 'Add New Entity'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="name"
                label="Entity Name"
                value={entityFormik.values.name}
                onChange={entityFormik.handleChange}
                onBlur={entityFormik.handleBlur}
                error={entityFormik.touched.name && Boolean(entityFormik.errors.name)}
                helperText={entityFormik.touched.name && entityFormik.errors.name}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Entity Type</InputLabel>
                <Select
                  name="type"
                  value={entityFormik.values.type}
                  onChange={entityFormik.handleChange}
                  label="Entity Type"
                >
                  <MenuItem value="fund">Fund</MenuItem>
                  <MenuItem value="feeder">Feeder Fund</MenuItem>
                  <MenuItem value="master">Master Fund</MenuItem>
                  <MenuItem value="parallel">Parallel Fund</MenuItem>
                  <MenuItem value="blocker">Blocker</MenuItem>
                  <MenuItem value="holding">Holding Company</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Jurisdiction</InputLabel>
                <Select
                  name="jurisdiction"
                  value={entityFormik.values.jurisdiction}
                  onChange={entityFormik.handleChange}
                  label="Jurisdiction"
                >
                  {jurisdictions.map(jurisdiction => (
                    <MenuItem key={jurisdiction} value={jurisdiction}>
                      {jurisdiction}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  name="currency"
                  value={entityFormik.values.currency}
                  onChange={entityFormik.handleChange}
                  label="Currency"
                >
                  {currencies.map(currency => (
                    <MenuItem key={currency} value={currency}>
                      {currency}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={entityFormik.values.status}
                  onChange={entityFormik.handleChange}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="liquidating">Liquidating</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Parent Entity</InputLabel>
                <Select
                  name="parentId"
                  value={entityFormik.values.parentId}
                  onChange={entityFormik.handleChange}
                  label="Parent Entity"
                >
                  <MenuItem value="">None (Root Entity)</MenuItem>
                  {configuration.entities
                    .filter(e => e.id !== editingEntity?.id)
                    .map(entity => (
                      <MenuItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Fee Settings
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                name="settings.managementFeeRate"
                label="Management Fee Rate (%)"
                value={entityFormik.values.settings.managementFeeRate}
                onChange={entityFormik.handleChange}
                InputProps={{ inputProps: { min: 0, max: 10, step: 0.1 } }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                name="settings.carriedInterestRate"
                label="Carried Interest Rate (%)"
                value={entityFormik.values.settings.carriedInterestRate}
                onChange={entityFormik.handleChange}
                InputProps={{ inputProps: { min: 0, max: 50, step: 1 } }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                name="settings.preferredReturn"
                label="Preferred Return (%)"
                value={entityFormik.values.settings.preferredReturn}
                onChange={entityFormik.handleChange}
                InputProps={{ inputProps: { min: 0, max: 20, step: 0.1 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEntityDialogOpen(false);
            setEditingEntity(null);
            entityFormik.resetForm();
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={entityFormik.handleSubmit as any}
            disabled={!entityFormik.isValid}
          >
            {editingEntity ? 'Update Entity' : 'Add Entity'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Relationships Dialog Placeholder */}
      <Dialog
        open={relationshipDialogOpen}
        onClose={() => setRelationshipDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Manage Entity Relationships</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            Relationship management interface would be implemented here, allowing users to define 
            ownership, management, and investment relationships between entities.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRelationshipDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FundStructure;