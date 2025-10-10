import './ArrangeEvents.css';
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { IoMdAdd } from "react-icons/io";
import { MdEventAvailable } from "react-icons/md";
import { BsCalendarDate } from "react-icons/bs";
import { AiOutlineClockCircle } from "react-icons/ai";
import { BiDetail } from "react-icons/bi";
import { FaArrowLeft, FaSignOutAlt } from "react-icons/fa";
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

let ArrangeEvents = () => {
  const { logout } = useAuth();
  let [tasks, setTasks] = useState([]);
  let [newTask, setNewTask] = useState("");
  let [newDate, setNewDate] = useState("");
  let [newTime, setNewTime] = useState("");
  let [newDescription, setNewDescription] = useState("");
  let [newDuration, setNewDuration] = useState("");
  let [loading, setLoading] = useState(false);
  let [error, setError] = useState(null);

  let handleInputChange = (event) => setNewTask(event.target.value);
  let handleDateChange = (event) => setNewDate(event.target.value);
  let handleTimeChange = (event) => setNewTime(event.target.value);
  let handleDescriptionChange = (event) => setNewDescription(event.target.value);

  useEffect(() => {
    // preload existing events
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const { data } = await axios.get(`${base}/api/events`);
        // map to UI structure expected
        const items = (data.events || []).map(e => ({
          id: e.id,
          text: e.event_name,
          date: e.date,
          time: e.time,
          description: e.description,
          status: e.status,
          duration_minutes: e.duration_minutes,
          createdAt: e.createdAt,
        }));
        setTasks(items);
      } catch (e) {
        setError(e.response?.data?.message || e.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  let addTask = async (event) => {
    event.preventDefault();
    if (newTask.trim() === "" || !newDate || !newTime || !newDuration) return;
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const payload = {
        event_name: newTask,
        date: newDate,
        time: newTime,
        description: newDescription,
        duration_minutes: Number(newDuration),
      };
      const { data } = await axios.post(`${base}/api/events`, payload);
      const e = data.event;
      const newItem = {
        id: e.id,
        text: e.event_name,
        date: e.date,
        time: e.time,
        description: e.description,
        status: e.status,
        duration_minutes: e.duration_minutes,
        createdAt: e.createdAt,
      };
      // newest on top (API already returns newest first, but ensure optimistic insert at top)
      setTasks(prev => [newItem, ...prev]);
      setNewTask("");
      setNewDate("");
      setNewTime("");
      setNewDescription("");
      setNewDuration("");
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create event. You may need to log in as authority/admin.');
    }
  };

  let deleteTask = (index) => {
    let updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="Event-List">
      <div className="header-row">
        <button
          className="back-button"
          onClick={() => navigate('/govt-dashboard')}
        >
          <FaArrowLeft /> Go Back
        </button>
        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
      <form onSubmit={addTask}>
        <h1>Arrange Events</h1>
        <div className="form-inputs">
          <input
            type="text"
            placeholder="Enter event name..."
            value={newTask}
            onChange={handleInputChange}
          />
          <input type="date" value={newDate} onChange={handleDateChange} />
          <input type="time" value={newTime} onChange={handleTimeChange} />
          <input
            type="text"
            placeholder="Enter description..."
            value={newDescription}
            onChange={handleDescriptionChange}
          />
          <input
            type="number"
            min="1"
            placeholder="Duration (minutes)"
            value={newDuration}
            onChange={(e) => setNewDuration(e.target.value)}
          />
          <button className="add-button btn btn-success" type="submit">
            Add <IoMdAdd />
          </button>
        </div>

        {loading && <div>Loading events...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}

        <ol>
          {tasks.map((task, index) => (
            <li key={task.id ?? index}>
              <span className="text">
                <p><MdEventAvailable /> <b>Event:</b> {task.text}</p>
                <p><BsCalendarDate /> <b>Date:</b> {task.date}</p>
                <p><AiOutlineClockCircle /> <b>Time:</b> {task.time}</p>
                <p><BiDetail /> <b>Description:</b> {task.description}</p>
                <p><b>Duration:</b> {task.duration_minutes} min</p>
                <p>
                  <b>Status:</b>{' '}
                  <span className={`status-pill status-${task.status || 'upcoming'}`}>
                    {task.status || 'upcoming'}
                  </span>
                </p>
              </span>
              {/* Delete UX can be added later when a delete API exists */}
            </li>
          ))}
        </ol>

        <button
          type="button"
          className="btn btn-outline-success position-relative"
        >
          Total Events
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {tasks.length}
            <span className="visually-hidden">unread messages</span>
          </span>
        </button>
      </form>
    </div>
  );
};

export default ArrangeEvents;
