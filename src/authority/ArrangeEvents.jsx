import './ArrangeEvents.css';
import { useState } from "react";
import { IoMdAdd } from "react-icons/io";
import { MdEventAvailable } from "react-icons/md";
import { BsCalendarDate } from "react-icons/bs";
import { AiOutlineClockCircle } from "react-icons/ai";
import { BiDetail } from "react-icons/bi";

let ArrangeEvents = () => {
  let [tasks, setTasks] = useState([]);
  let [newTask, setNewTask] = useState("");
  let [newDate, setNewDate] = useState("");
  let [newTime, setNewTime] = useState("");
  let [newDescription, setNewDescription] = useState("");

  let handleInputChange = (event) => setNewTask(event.target.value);
  let handleDateChange = (event) => setNewDate(event.target.value);
  let handleTimeChange = (event) => setNewTime(event.target.value);
  let handleDescriptionChange = (event) => setNewDescription(event.target.value);

  let addTask = (event) => {
    event.preventDefault();
    if (newTask.trim() !== "") {
      setTasks([
        ...tasks,
        {
          text: newTask,
          date: newDate,
          time: newTime,
          description: newDescription,
        },
      ]);
      setNewTask("");
      setNewDate("");
      setNewTime("");
      setNewDescription("");
    }
  };

  let deleteTask = (index) => {
    let updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
  };

  return (
    <div className="Event-List">
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
          <button className="add-button btn btn-success" type="submit">
            Add <IoMdAdd />
          </button>
        </div>

        <ol>
          {tasks.map((task, index) => (
            <li key={index}>
              <span className="text">
                <p><MdEventAvailable /> <b>Event:</b> {task.text}</p>
                <p><BsCalendarDate /> <b>Date:</b> {task.date}</p>
                <p><AiOutlineClockCircle /> <b>Time:</b> {task.time}</p>
                <p><BiDetail /> <b>Description:</b> {task.description}</p>
              </span>
              <button
                type="button"
                className="delete-button btn btn-danger"
                onClick={() => deleteTask(index)}
              >
                Delete
              </button>
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
