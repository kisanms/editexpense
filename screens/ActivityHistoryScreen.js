import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import * as Calendar from 'expo-calendar';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

const ActivityHistoryScreen = () => {
  const { user, organizationData } = useAuth();
  const [activities, setActivities] = useState([]);
  const [editors, setEditors] = useState([]);
  const [selectedEditor, setSelectedEditor] = useState(null);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPayment, setTaskPayment] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(new Date());

  useEffect(() => {
    loadActivities();
    loadEditors();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const activitiesRef = collection(db, 'organizations', user.organizationId, 'activities');
      const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      
      const activityList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      
      setActivities(activityList);
    } catch (error) {
      console.error('Error loading activities:', error);
      Alert.alert('Error', 'Failed to load activity history');
    } finally {
      setLoading(false);
    }
  };

  const loadEditors = async () => {
    try {
      const editors = organizationData.members.filter(member => 
        member.permissions?.includes('editor')
      );
      setEditors(editors);
    } catch (error) {
      console.error('Error loading editors:', error);
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
      const task = {
        title: taskTitle,
        description: taskDescription,
        payment: parseFloat(taskPayment),
        dueDate: taskDueDate,
        status: 'assigned'
      };

      // Add to editor's tasks
      const taskRef = collection(db, 'organizations', user.organizationId, 'editorTasks');
      await addDoc(taskRef, {
        editorId: selectedEditor.uid,
        ...task,
        assignedBy: user.uid,
        assignedAt: new Date()
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
              endDate: new Date(taskDueDate.getTime() + 60 * 60 * 1000), // 1 hour duration
              alarms: [{ relativeOffset: -24 * 60 }] // 24 hour reminder
            });
          }
        }
      }

      Alert.alert('Success', 'Task assigned and payment reminder set');
      setShowEditorModal(false);
      clearTaskForm();
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

      // Get editor's tasks
      const tasksRef = collection(db, 'organizations', user.organizationId, 'editorTasks');
      const q = query(tasksRef, where('editorId', '==', editor.uid));
      const snapshot = await getDocs(q);

      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Create CSV content
      const csvContent = [
        'Task Title,Description,Payment,Due Date,Status,Assigned Date',
        ...tasks.map(task => [
          task.title,
          task.description,
          task.payment,
          format(task.dueDate.toDate(), 'yyyy-MM-dd'),
          task.status,
          format(task.assignedAt.toDate(), 'yyyy-MM-dd')
        ].join(','))
      ].join('\n');

      if (Platform.OS === 'web') {
        // For web, create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${editor.name}_tasks.csv`;
        a.click();
      } else {
        // For mobile, save and share
        const fileUri = `${FileSystem.documentDirectory}${editor.name}_tasks.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent);
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      Alert.alert('Error', 'Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const clearTaskForm = () => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskPayment('');
    setTaskDueDate(new Date());
  };

  const renderActivityItem = (activity) => {
    let icon, color;
    switch (activity.action) {
      case 'create_organization':
        icon = 'business';
        color = '#4A6FFF';
        break;
      case 'invite_member':
        icon = 'person-add';
        color = '#30B0C7';
        break;
      case 'update_permissions':
        icon = 'shield-checkmark';
        color = '#FF9500';
        break;
      case 'assign_task':
        icon = 'document-text';
        color = '#34C759';
        break;
      default:
        icon = 'ellipsis-horizontal';
        color = '#8E8E93';
    }

    return (
      <View key={activity.id} style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityUser}>{activity.userEmail}</Text>
          <Text style={styles.activityDescription}>
            {getActivityDescription(activity)}
          </Text>
          <Text style={styles.activityTime}>
            {format(activity.timestamp, 'MMM d, yyyy h:mm a')}
          </Text>
        </View>
      </View>
    );
  };

  const getActivityDescription = (activity) => {
    switch (activity.action) {
      case 'create_organization':
        return `Created organization "${activity.details.organizationName}"`;
      case 'invite_member':
        return `Invited ${activity.details.email} with ${activity.details.permissions.join(', ')} permissions`;
      case 'update_permissions':
        return `Updated permissions for a user`;
      case 'assign_task':
        return `Assigned task "${activity.details.taskTitle}"`;
      default:
        return 'Performed an action';
    }
  };

  const renderEditorItem = (editor) => {
    const [editorTasks, setEditorTasks] = useState([]);
    const [totalPaid, setTotalPaid] = useState(0);
    const [totalPending, setTotalPending] = useState(0);

    useEffect(() => {
      loadEditorTasks(editor.uid);
    }, [editor.uid]);

    const loadEditorTasks = async (editorId) => {
      try {
        const tasksRef = collection(db, 'organizations', user.organizationId, 'editorTasks');
        const q = query(tasksRef, where('editorId', '==', editorId));
        const snapshot = await getDocs(q);
        
        const tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setEditorTasks(tasks);

        // Calculate totals
        let paid = 0;
        let pending = 0;
        tasks.forEach(task => {
          if (task.status === 'paid') {
            paid += task.payment;
          } else {
            pending += task.payment;
          }
        });
        setTotalPaid(paid);
        setTotalPending(pending);
      } catch (error) {
        console.error('Error loading editor tasks:', error);
      }
    };

    const markTaskAsPaid = async (taskId) => {
      try {
        const taskRef = doc(db, 'organizations', user.organizationId, 'editorTasks', taskId);
        await updateDoc(taskRef, {
          status: 'paid',
          paidAt: serverTimestamp()
        });

        // Log the payment activity
        await logActivity('task_payment', {
          editorId: editor.uid,
          taskId,
          amount: editorTasks.find(t => t.id === taskId)?.payment
        });

        // Reload tasks
        loadEditorTasks(editor.uid);
      } catch (error) {
        console.error('Error marking task as paid:', error);
        Alert.alert('Error', 'Failed to mark task as paid');
      }
    };

    return (
      <View key={editor.uid} style={styles.editorItem}>
        <View style={styles.editorInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {editor.name?.[0] || editor.email?.[0]?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.editorDetails}>
            <Text style={styles.editorName}>
              {editor.name || editor.email.split('@')[0]}
            </Text>
            <Text style={styles.editorEmail}>{editor.email}</Text>
            <View style={styles.paymentSummary}>
              <Text style={styles.paymentText}>
                Paid: <Text style={styles.amountPaid}>${totalPaid}</Text>
              </Text>
              <Text style={styles.paymentText}>
                Pending: <Text style={styles.amountPending}>${totalPending}</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tasksList}>
          {editorTasks.map(task => (
            <View key={task.id} style={styles.taskItem}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={[
                  styles.taskStatus,
                  task.status === 'paid' ? styles.statusPaid : styles.statusPending
                ]}>
                  {task.status === 'paid' ? 'PAID' : 'PENDING'}
                </Text>
              </View>
              <Text style={styles.taskDescription}>{task.description}</Text>
              <View style={styles.taskFooter}>
                <Text style={styles.taskPayment}>${task.payment}</Text>
                <Text style={styles.taskDate}>
                  Due: {format(task.dueDate.toDate(), 'MMM d, yyyy')}
                </Text>
                {task.status !== 'paid' && (
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => markTaskAsPaid(task.id)}
                  >
                    <Text style={styles.payButtonText}>Mark as Paid</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.editorActions}>
          <TouchableOpacity
            style={styles.editorAction}
            onPress={() => {
              setSelectedEditor(editor);
              setShowEditorModal(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color="#4A6FFF" />
            <Text style={styles.editorActionText}>Add Task</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editorAction}
            onPress={() => downloadEditorReport(editor)}
          >
            <Ionicons name="download-outline" size={24} color="#34C759" />
            <Text style={styles.editorActionText}>Download Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Editors</Text>
          {editors.map(renderEditorItem)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {activities.map(renderActivityItem)}
        </View>
      </ScrollView>

      <Modal
        visible={showEditorModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Task</Text>
              <TouchableOpacity onPress={() => setShowEditorModal(false)}>
                <Ionicons name="close" size={24} color="#6e6e73" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Assign a new task to {selectedEditor?.name || selectedEditor?.email?.split('@')[0]}
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Task Title"
                value={taskTitle}
                onChangeText={setTaskTitle}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Task Description"
                value={taskDescription}
                onChangeText={setTaskDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Payment Amount"
                value={taskPayment}
                onChangeText={setTaskPayment}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[styles.assignButton, loading && styles.assignButtonDisabled]}
              onPress={handleAssignTask}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.assignButtonText}>Assigning...</Text>
              ) : (
                <Text style={styles.assignButtonText}>Assign Task</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  activityItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6e6e73',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#8e8e93',
  },
  editorItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  editorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4A6FFF15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A6FFF',
  },
  editorDetails: {
    flex: 1,
  },
  editorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  editorEmail: {
    fontSize: 14,
    color: '#6e6e73',
  },
  editorActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  editorAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  editorActionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6e6e73',
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  modalDescription: {
    fontSize: 16,
    color: '#6e6e73',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
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
  assignButton: {
    backgroundColor: '#4A6FFF',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignButtonDisabled: {
    opacity: 0.7,
  },
  assignButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentSummary: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 16,
  },
  paymentText: {
    fontSize: 14,
    color: '#6e6e73',
  },
  amountPaid: {
    color: '#34C759',
    fontWeight: '600',
  },
  amountPending: {
    color: '#FF9500',
    fontWeight: '600',
  },
  tasksList: {
    marginTop: 12,
  },
  taskItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
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
  taskDescription: {
    fontSize: 14,
    color: '#6e6e73',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskPayment: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A6FFF',
  },
  taskDate: {
    fontSize: 14,
    color: '#6e6e73',
  },
  payButton: {
    backgroundColor: '#4A6FFF15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  payButtonText: {
    fontSize: 14,
    color: '#4A6FFF',
    fontWeight: '600',
  },
});

export default ActivityHistoryScreen; 