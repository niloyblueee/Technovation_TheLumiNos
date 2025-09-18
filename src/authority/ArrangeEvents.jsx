import './ArrangeEvents.css';
import { useState } from "react";
import { IoMdAdd } from "react-icons/io";
import { MdEventAvailable } from "react-icons/md";
import { BsCalendarDate } from "react-icons/bs";

let ArrangeEvents = () => {
  let [tasks, setTasks] = useState([]);
  let [newTask, setNewTask] = useState("");
  let [newDate, setNewDate] = useState("");

  let handleInputChange = (event) => {
    setNewTask(event.target.value);
  };

  let handleDateChange = (event) => {
    setNewDate(event.target.value);
  };

  let addTask = (event) => {
    event.preventDefault();
    if (newTask.trim() !== "") {
      setTasks([...tasks, { text: newTask, date: newDate }]);
      setNewTask("");
      setNewDate("");
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
        <div>
          <input
            type="text"
            placeholder="Enter an event..."
            value={newTask}
            onChange={handleInputChange}
          />
          <input type="date" value={newDate} onChange={handleDateChange} />
          <button className="add-button" type="submit">
            Add <IoMdAdd />
          </button>
        </div>

        <ol>
          {tasks.map((task, index) => (
            <li key={index}>
              <span className="text">
                <p><MdEventAvailable /> Event name: {task.text}{" "}</p>   
                <p><BsCalendarDate /> Date: {task.date}{" "}</p>   

    

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

        <button type="buttonSuccess" className="btn btn-outline-success position-relative">
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
