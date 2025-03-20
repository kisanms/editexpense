import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import * as Calendar from 'expo-calendar';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const EditorProfileScreen = () => {
  const { user, organizationData } = useAuth();
  const [editors, setEditors] = useState([]);
  const [selectedEditor, setSelectedEditor] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Editor form states
  const [editorName, setEditorName] = useState('');
  const [editorEmail, setEditorEmail] = useState('');
  const [editorPhone, setEditorPhone] = useState('');
  const [editorProfession, setEditorProfession] = useState('');
  const [editorRate, setEditorRate] = useState('');

  // Task form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPayment, setTaskPayment] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(new Date());

  useEffect(() => {
    loadEditors();
  }, []);

  const loadEditors = async () => {
    try {
      setLoading(true);
      const editorsRef = collection(db, 'organizations', user.organizationId, 'editors');
      const snapshot = await getDocs(editorsRef);
      
      const editorsList = await Promise.all(snapshot.docs.map(async doc => {
        const editor = { id: doc.id, ...doc.data() };
        
        // Get tasks for this editor
        const tasksRef = collection(db, 'organizations', user.organizationId, 'editorTasks');
        const tasksQuery = query(tasksRef, where('editorId', '==', doc.id));
        const tasksSnapshot = await getDocs(tasksQuery);
        
        const tasks = tasksSnapshot.docs.map(taskDoc => ({
          id: taskDoc.id,
          ...taskDoc.data()
        }));
        
        // Calculate totals
        const totals = tasks.reduce((acc, task) => {
          if (task.status === 'paid') {
            acc.paid += task.payment;
          } else {
            acc.pending += task.payment;
          }
          return acc;
        }, { paid: 0, pending: 0 });
        
        return {
          ...editor,
          tasks,
          totalPaid: totals.paid,
          totalPending: totals.pending
        };
      }));
      
      setEditors(editorsList);
    } catch (error) {
      console.error('Error loading editors:', error);
      Alert.alert('Error', 'Failed to load editors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEditor = async () => {
    try {
      if (!editorName || !editorEmail || !editorPhone || !editorProfession || !editorRate) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      setLoading(true);

      const editorsRef = collection(db, 'organizations', user.organizationId, 'editors');
      await addDoc(editorsRef, {
        name: editorName,
        email: editorEmail,
        phone: editorPhone,
        profession: editorProfession,
        rate: parseFloat(editorRate),
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });

      // Log activity
      const activityRef = collection(db, 'organizations', user.organizationId, 'activities');
      await addDoc(activityRef, {
        type: 'editor_added',
        editorName,
        editorEmail,
        performedBy: user.email,
        timestamp: serverTimestamp()
      });

      clearEditorForm();
      setShowAddModal(false);
      loadEditors();
      Alert.alert('Success', 'Editor added successfully');
    } catch (error) {
      console.error('Error adding editor:', error);
      Alert.alert('Error', 'Failed to add editor');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async () => {
    try {
      if (!taskTitle || !taskDescription || !taskPayment) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      setLoading(true);

      // Create task
      const taskRef = collection(db, 'organizations', user.organizationId, 'editorTasks');
      const taskDoc = await addDoc(taskRef, {
        editorId: selectedEditor.id,
        title: taskTitle,
        description: taskDescription,
        payment: parseFloat(taskPayment),
        dueDate: taskDueDate,
        status: 'pending',
        assignedBy: user.uid,
        assignedAt: serverTimestamp()
      });

      // Log activity
      const activityRef = collection(db, 'organizations', user.organizationId, 'activities');
      await addDoc(activityRef, {
        type: 'task_assigned',
        editorId: selectedEditor.id,
        editorName: selectedEditor.name,
        taskId: taskDoc.id,
        taskTitle,
        payment: parseFloat(taskPayment),
        performedBy: user.email,
        timestamp: serverTimestamp()
      });

      // Add calendar event
      if (Platform.OS !== 'web') {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status === 'granted') {
          const calendars = await Calendar.getCalendarsAsync();
          const defaultCalendar = calendars.find(cal => cal.isPrimary);

          if (defaultCalendar) {
            await Calendar.createEventAsync(defaultCalendar.id, {
              title: `Payment Due: ${selectedEditor.name} - ${taskTitle}`,
              notes: `Payment of $${taskPayment} due for task: ${taskDescription}`,
              startDate: taskDueDate,
              endDate: new Date(taskDueDate.getTime() + 60 * 60 * 1000),
              alarms: [{ relativeOffset: -24 * 60 }]
            });
          }
        }
      }

      clearTaskForm();
      setShowTaskModal(false);
      loadEditors();
      Alert.alert('Success', 'Task assigned successfully');
    } catch (error) {
      console.error('Error assigning task:', error);
      Alert.alert('Error', 'Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  const downloadEditorReport = async (editor) => {
    try {
      setLoading(true);

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Create tasks worksheet
      const tasksData = [
        ['Task Title', 'Description', 'Payment', 'Status', 'Due Date', 'Assigned Date'],
        ...editor.tasks.map(task => [
          task.title,
          task.description,
          task.payment,
          task.status,
          format(task.dueDate.toDate(), 'yyyy-MM-dd'),
          format(task.assignedAt.toDate(), 'yyyy-MM-dd')
        ])
      ];
      const ws = XLSX.utils.aoa_to_sheet(tasksData);

      // Add summary at the bottom
      XLSX.utils.sheet_add_aoa(ws, [
        [''],
        ['Summary'],
        ['Total Paid', editor.totalPaid],
        ['Total Pending', editor.totalPending],
        ['Total Tasks', editor.tasks.length]
      ], { origin: -1 });

      XLSX.utils.book_append_sheet(wb, ws, 'Tasks');

      // Generate Excel file
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      if (Platform.OS === 'web') {
        // For web, create and trigger download
        const blob = new Blob([s2ab(atob(wbout))], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${editor.name}_report.xlsx`;
        a.click();
      } else {
        // For mobile, save and share
        const fileUri = `${FileSystem.documentDirectory}${editor.name}_report.xlsx`;
        await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      Alert.alert('Error', 'Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const clearEditorForm = () => {
    setEditorName('');
    setEditorEmail('');
    setEditorPhone('');
    setEditorProfession('');
    setEditorRate('');
  };

  const clearTaskForm = () => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskPayment('');
    setTaskDueDate(new Date());
  };

  const renderEditorCard = (editor) => (
    <View key={editor.id} style={styles.editorCard}>
      <View style={styles.editorHeader}>
        <View style={styles.editorAvatar}>
          <Text style={styles.avatarText}>
            {editor.name[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.editorInfo}>
          <Text style={styles.editorName}>{editor.name}</Text>
          <Text style={styles.editorProfession}>{editor.profession}</Text>
          <Text style={styles.editorContact}>{editor.email} • {editor.phone}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${editor.totalPaid}</Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${editor.totalPending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{editor.tasks.length}</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
      </View>

      <View style={styles.tasksList}>
        {editor.tasks.slice(0, 3).map(task => (
          <View key={task.id} style={styles.taskItem}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={[
                styles.taskStatus,
                task.status === 'paid' ? styles.statusPaid : styles.statusPending
              ]}>
                {task.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.taskPayment}>${task.payment}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedEditor(editor);
            setShowTaskModal(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color="#4A6FFF" />
          <Text style={styles.actionButtonText}>Add Task</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => downloadEditorReport(editor)}
        >
          <Ionicons name="download-outline" size={20} color="#4A6FFF" />
          <Text style={styles.actionButtonText}>Download Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Editor Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {editors.map(renderEditorCard)}
      </ScrollView>

      {/* Add Editor Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Editor</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#6e6e73" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={editorName}
                  onChangeText={setEditorName}
                  placeholder="Enter editor's name"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editorEmail}
                  onChangeText={setEditorEmail}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={editorPhone}
                  onChangeText={setEditorPhone}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Profession</Text>
                <TextInput
                  style={styles.input}
                  value={editorProfession}
                  onChangeText={setEditorProfession}
                  placeholder="Enter profession"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Hourly Rate ($)</Text>
                <TextInput
                  style={styles.input}
                  value={editorRate}
                  onChangeText={setEditorRate}
                  placeholder="Enter hourly rate"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleAddEditor}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Adding...' : 'Add Editor'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Assign Task Modal */}
      <Modal
        visible={showTaskModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Task</Text>
              <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                <Ionicons name="close" size={24} color="#6e6e73" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.modalDescription}>
                Assigning task to {selectedEditor?.name}
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Task Title</Text>
                <TextInput
                  style={styles.input}
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  placeholder="Enter task title"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  placeholder="Enter task description"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Payment Amount ($)</Text>
                <TextInput
                  style={styles.input}
                  value={taskPayment}
                  onChangeText={setTaskPayment}
                  placeholder="Enter payment amount"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleAssignTask}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Assigning...' : 'Assign Task'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A6FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  editorCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  editorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A6FFF15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A6FFF',
  },
  editorInfo: {
    flex: 1,
  },
  editorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  editorProfession: {
    fontSize: 16,
    color: '#4A6FFF',
    marginBottom: 4,
  },
  editorContact: {
    fontSize: 14,
    color: '#6e6e73',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6e6e73',
  },
  tasksList: {
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskHeader: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: '#1c1c1e',
    marginBottom: 2,
  },
  taskStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusPaid: {
    backgroundColor: '#34C75915',
    color: '#34C759',
  },
  statusPending: {
    backgroundColor: '#FF950015',
    color: '#FF9500',
  },
  taskPayment: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A6FFF',
    marginLeft: 16,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4A6FFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  modalDescription: {
    fontSize: 16,
    color: '#6e6e73',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6e6e73',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1c1c1e',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4A6FFF',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditorProfileScreen; 