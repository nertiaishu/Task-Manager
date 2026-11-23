
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '../components/Header';
import ChecklistSidebar from './ChecklistSidebar';
import MyChecklist from './MyChecklist';
import CreateChecklist from './CreateChecklist';

const API = import.meta.env.VITE_API_URL;

function Checklist({ user: propUser }) {
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('my-checklist');
  const [employeeList, setEmployeeList] = useState([]);

  const storedUser = JSON.parse(
    sessionStorage.getItem('user') || '{}'
  );

  const user = propUser || storedUser;

  const currentUser =
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    '';

  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    navigate('/auth/login');
  };

  const fetchEmployees = async () => {
    try {
      const token = sessionStorage.getItem('authToken');

      if (!token || !API) {
        console.error('Authentication token or API URL is missing.');
        return;
      }

      const res = await fetch(`${API}/api/checklists/employees`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok) {
        const employees = Array.isArray(data)
          ? data
          : Array.isArray(data.employees)
            ? data.employees
            : Array.isArray(data.data)
              ? data.data
              : [];

        setEmployeeList(employees);
      } else {
        console.error('Failed to load employees:', data.message);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f7fb]">

      <Header
        user={user}
        onLogout={handleLogout}
      />

      {/* main layout for sidebar and content */}
      <div className="
        mt-[20px]
        grid
        grid-cols-1
        items-start
        gap-3
        min-[721px]:grid-cols-[180px_minmax(0,1fr)]
        min-[721px]:gap-5
        min-[1001px]:grid-cols-[210px_minmax(0,1fr)]
      ">

        <div className="min-w-0">
          <ChecklistSidebar
            activeView={activeView}
            setActiveView={setActiveView}
          />
        </div>

        <section className="min-w-0">
          {activeView === 'my-checklist' && (
            <MyChecklist
              currentUser={currentUser}
              employeeList={employeeList}
            />
          )}

          {activeView === 'create-checklist' && (
            <CreateChecklist
              employeeList={employeeList}
              onSaveSuccess={() => setActiveView('my-checklist')}
            />
          )}
        </section>

      </div>
    </div>
  );
}

export default Checklist;
