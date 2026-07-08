import asyncio
import re
import os
from pathlib import Path
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

MONGO_URL = os.getenv("MONGODB_URL")
if not MONGO_URL:
    raise RuntimeError(f"❌ MONGODB_URL not found! Checked .env at: {ENV_PATH}")

DB_NAME    = "interviewai"
COLLECTION = "questions"

ROBOTICS_QUESTIONS = [
    {"question": "What is a Degree of Freedom (DOF) in robotics?",
     "answer": "A Degree of Freedom is an independent parameter that defines the configuration of a robotic system, such as one axis of rotation or translation. A robotic arm with 6 DOF can position and orient its end-effector in 3D space fully.",
     "difficulty": "easy"},
    {"question": "What is the difference between a sensor and an actuator?",
     "answer": "A sensor measures a physical quantity (light, distance, temperature) and converts it into a signal the robot can process. An actuator converts a control signal into physical motion or force, such as a motor or servo.",
     "difficulty": "easy"},
    {"question": "What is ROS (Robot Operating System)?",
     "answer": "ROS is an open-source middleware framework providing libraries and tools for building robot applications, including hardware abstraction, device drivers, message-passing between processes (nodes), and package management.",
     "difficulty": "easy"},
    {"question": "What is the difference between forward kinematics and inverse kinematics?",
     "answer": "Forward kinematics computes the end-effector's position and orientation given the joint angles. Inverse kinematics does the opposite — it computes the joint angles needed to achieve a desired end-effector position.",
     "difficulty": "easy"},
    {"question": "What is a PID controller?",
     "answer": "A PID (Proportional-Integral-Derivative) controller is a feedback control loop that continuously calculates an error value and applies a correction based on proportional, integral, and derivative terms to minimize that error over time.",
     "difficulty": "easy"},
    {"question": "What is the purpose of an encoder in robotics?",
     "answer": "An encoder measures the position or speed of a rotating shaft, typically on a motor, allowing the robot to know how far a wheel or joint has moved for accurate positioning and closed-loop control.",
     "difficulty": "easy"},
    {"question": "What is a LIDAR sensor used for?",
     "answer": "LIDAR (Light Detection and Ranging) uses laser pulses to measure distances to surrounding objects, generating a point cloud used for mapping, obstacle detection, and localization.",
     "difficulty": "easy"},
    {"question": "What is the difference between an IMU and a GPS sensor?",
     "answer": "An IMU (Inertial Measurement Unit) measures acceleration and angular velocity to estimate orientation and motion changes locally. GPS provides absolute position on Earth using satellite signals, but doesn't work well indoors.",
     "difficulty": "easy"},
    {"question": "What is a servo motor?",
     "answer": "A servo motor is a rotary actuator that allows precise control of angular position, velocity, and acceleration, typically using a built-in feedback mechanism like a potentiometer or encoder.",
     "difficulty": "easy"},
    {"question": "What is the difference between open-loop and closed-loop control?",
     "answer": "Open-loop control sends commands without checking the actual output, so it cannot correct for errors. Closed-loop control uses sensor feedback to continuously compare actual output to desired output and adjust accordingly.",
     "difficulty": "easy"},
    {"question": "What is a robot end-effector?",
     "answer": "The end-effector is the device at the end of a robotic arm designed to interact with the environment, such as a gripper, welding torch, or suction cup, depending on the task.",
     "difficulty": "easy"},
    {"question": "What is the role of a microcontroller in an embedded robotic system?",
     "answer": "A microcontroller executes low-level control code, reads sensor inputs, and sends commands to actuators in real time. It typically handles time-critical tasks close to the hardware, unlike a general-purpose computer running higher-level logic.",
     "difficulty": "easy"},
    {"question": "What is odometry in mobile robotics?",
     "answer": "Odometry estimates a robot's position and orientation over time using data from motion sensors like wheel encoders. It accumulates small errors over time, a phenomenon known as drift.",
     "difficulty": "easy"},
    {"question": "What is the difference between a differential drive robot and an omnidirectional robot?",
     "answer": "A differential drive robot uses two independently driven wheels and can only move forward, backward, and turn in place. An omnidirectional robot, often using mecanum or omni wheels, can move in any direction without needing to rotate first.",
     "difficulty": "easy"},
    {"question": "What is the purpose of a gyroscope in a robot?",
     "answer": "A gyroscope measures angular velocity, helping a robot determine its orientation and detect rotational movement, which is essential for balance and stabilization in systems like drones and legged robots.",
     "difficulty": "easy"},
    {"question": "What is a workspace in robotic manipulator design?",
     "answer": "The workspace is the total volume of space that a robot's end-effector can reach, determined by the arm's link lengths, joint types, and joint limits.",
     "difficulty": "easy"},
    {"question": "What is the difference between a revolute joint and a prismatic joint?",
     "answer": "A revolute joint allows rotational motion around an axis, like an elbow joint. A prismatic joint allows linear sliding motion along an axis, like a piston.",
     "difficulty": "easy"},
    {"question": "What is teleoperation in robotics?",
     "answer": "Teleoperation is the control of a robot from a distance by a human operator, typically using a remote controller, joystick, or haptic interface, rather than the robot acting autonomously.",
     "difficulty": "easy"},
    {"question": "What is the purpose of a ROS topic?",
     "answer": "A ROS topic is a named communication channel over which nodes exchange messages asynchronously using a publish-subscribe model, allowing decoupled communication between different parts of a robotic system.",
     "difficulty": "easy"},
    {"question": "What is proprioception in robotics?",
     "answer": "Proprioception refers to a robot's internal sense of its own state, such as joint angles, velocities, and forces, typically obtained from internal sensors like encoders rather than sensing the external environment.",
     "difficulty": "easy"},
    {"question": "Explain the difference between SLAM and simple mapping.",
     "answer": "SLAM (Simultaneous Localization and Mapping) solves two problems at once: building a map of an unknown environment while simultaneously tracking the robot's own position within that map. Simple mapping assumes the robot's position is already known, which is a much easier problem.",
     "difficulty": "medium"},
    {"question": "How does a Kalman filter help with sensor fusion in robotics?",
     "answer": "A Kalman filter combines noisy measurements from multiple sensors (e.g., IMU and wheel odometry) with a predictive motion model to produce a more accurate and smoother estimate of the robot's true state than any single sensor could provide alone.",
     "difficulty": "medium"},
    {"question": "What are the trade-offs between using ROS 1 and ROS 2?",
     "answer": "ROS 2 uses DDS for communication, providing real-time support, better security, and multi-robot support without a central master node, unlike ROS 1 which relies on a single roscore. However, ROS 1 still has a larger legacy package ecosystem in some domains.",
     "difficulty": "medium"},
    {"question": "How would you implement obstacle avoidance using a potential field algorithm?",
     "answer": "In a potential field approach, the goal generates an attractive force pulling the robot toward it, while obstacles generate repulsive forces pushing the robot away. The robot's motion is computed as the vector sum of these forces, though this can get stuck in local minima.",
     "difficulty": "medium"},
    {"question": "What is the difference between the A* and RRT path planning algorithms?",
     "answer": "A* is a graph-search algorithm that finds the optimal path on a discretized grid using a heuristic, well-suited for low-dimensional, static environments. RRT (Rapidly-exploring Random Tree) randomly samples the configuration space and is better suited for high-dimensional spaces like robotic arm planning, though it doesn't guarantee optimality.",
     "difficulty": "medium"},
    {"question": "Explain the concept of a Jacobian matrix in robotic manipulators.",
     "answer": "The Jacobian matrix relates joint velocities to end-effector velocity (linear and angular). It's used in inverse kinematics via iterative methods, in singularity analysis, and in converting between joint-space and task-space forces and velocities.",
     "difficulty": "medium"},
    {"question": "How does sensor fusion improve robustness compared to relying on a single sensor?",
     "answer": "Different sensors have different failure modes and strengths — cameras struggle in low light, LIDAR struggles with reflective/transparent surfaces, and IMUs drift over time. Fusing multiple sensors compensates for individual weaknesses and improves overall reliability and accuracy.",
     "difficulty": "medium"},
    {"question": "What is a singularity in robotic arm kinematics and why is it a problem?",
     "answer": "A singularity occurs when the robot's Jacobian matrix loses rank, meaning the end-effector loses one or more degrees of freedom of motion in certain directions. Near singularities, small end-effector movements can require extremely large or infinite joint velocities.",
     "difficulty": "medium"},
    {"question": "How would you design a communication architecture for a multi-robot system?",
     "answer": "Key considerations include choosing between centralized versus decentralized coordination, defining message formats and topics/services for inter-robot communication, handling network latency and packet loss, and ensuring the system degrades gracefully if one robot loses connectivity.",
     "difficulty": "medium"},
    {"question": "What is the difference between global and local path planning?",
     "answer": "Global path planning computes a full path from start to goal using a known or previously mapped environment, while local path planning continuously adjusts the immediate trajectory in real time to avoid dynamic obstacles the global planner didn't account for.",
     "difficulty": "medium"},
    {"question": "Design a state estimation pipeline for a mobile robot using LIDAR, camera, and IMU. What role does each sensor play and how would you fuse them?",
     "answer": "The IMU provides high-frequency orientation and acceleration data for short-term motion prediction. LIDAR provides accurate distance measurements for mapping and loop closure. The camera adds semantic and visual feature information for visual odometry. An Extended Kalman Filter or factor-graph-based optimizer would fuse these at different rates, using the IMU for prediction between LIDAR/camera updates.",
     "difficulty": "hard"},
    {"question": "How would you handle sim-to-real transfer when a reinforcement learning policy trained in simulation fails on real hardware?",
     "answer": "Common techniques include domain randomization (varying simulated physics parameters, textures, and sensor noise during training), system identification to better match the simulator to real dynamics, adding realistic sensor noise models during training, and fine-tuning the policy on real-world data after simulation training.",
     "difficulty": "hard"},
    {"question": "Explain how you would implement dynamic obstacle avoidance for a robot moving among pedestrians in a crowded environment.",
     "answer": "This typically requires predicting pedestrian trajectories (e.g., using social force models or learned trajectory prediction), then integrating those predictions into a local planner like Dynamic Window Approach or Model Predictive Control that accounts for both the robot's kinematic constraints and uncertainty in predicted human motion.",
     "difficulty": "hard"},
    {"question": "What are the challenges of achieving real-time control on an embedded system with limited compute, and how would you address them?",
     "answer": "Challenges include limited CPU cycles for control loops running at high frequency, memory constraints for sensor buffers, and ensuring deterministic timing. Solutions include using a real-time operating system (RTOS) with priority scheduling, offloading heavy perception computation to a separate onboard computer, and optimizing algorithms for fixed-point arithmetic where floating-point hardware is unavailable.",
     "difficulty": "hard"},
    {"question": "Derive the relationship between joint torques and end-effector forces using the Jacobian transpose, and explain its practical use.",
     "answer": "The relationship is torque = J^T * F, where J^T is the transpose of the Jacobian matrix and F is the force/torque vector at the end-effector. This is used in force control applications, such as compliant manipulation or impedance control, where you want the arm to apply or resist a specific force without solving full inverse kinematics.",
     "difficulty": "hard"},
    {"question": "How would you design a fault-tolerant control system for a quadruped robot if one leg's actuator fails mid-operation?",
     "answer": "The system needs real-time fault detection (monitoring for abnormal current draw, encoder mismatch, or unexpected joint behavior), then a reconfiguration strategy such as switching gait patterns to redistribute weight to the remaining functional legs, along with reduced speed and more conservative footstep planning to maintain stability.",
     "difficulty": "hard"},
    {"question": "Explain the difference between Extended Kalman Filter (EKF) SLAM and graph-based SLAM, including their computational trade-offs.",
     "answer": "EKF-SLAM maintains a single Gaussian estimate of robot pose and landmark positions, updated incrementally; it scales poorly (quadratically) with the number of landmarks. Graph-based SLAM represents poses and constraints as a graph, periodically performing global nonlinear optimization to find the most consistent set of poses, scaling better with sparse solvers and handling loop closures more effectively.",
     "difficulty": "hard"},
    {"question": "How would you approach calibrating extrinsic parameters between a LIDAR and a camera mounted on the same robot?",
     "answer": "A common approach uses a calibration target visible to both sensors simultaneously across multiple poses, then solving an optimization problem that minimizes reprojection error between LIDAR point correspondences and camera-detected features to estimate rotation and translation between the sensor frames.",
     "difficulty": "hard"},
    {"question": "What design considerations would you make when implementing a Model Predictive Controller (MPC) for a robotic arm with actuator torque limits?",
     "answer": "The MPC formulation needs torque limits as hard inequality constraints at each timestep, a sufficiently accurate dynamics model to predict future states, an appropriate prediction horizon balancing computational cost against control quality, and ensuring the underlying optimization can be solved fast enough to run in real time.",
     "difficulty": "hard"},
    {"question": "How would you design a perception pipeline for a robot that needs to pick up previously unseen objects from a cluttered bin?",
     "answer": "The pipeline involves using a depth camera to generate a point cloud, segmenting individual objects using instance segmentation or geometric clustering, estimating feasible grasp poses using a grasp-planning network, and verifying the grasp is collision-free using the robot's kinematic model before executing with closed-loop force feedback to detect slip.",
     "difficulty": "hard"},
]


def _make_doc(item):
    return {
        "question":   item["question"],
        "answer":     item["answer"],
        "domain":     "robotics",
        "topic":      "robotics_general",
        "difficulty": item["difficulty"],
        "source":     "curated-manual",
        "tags":       ["embedded", "ros", "hardware", "control-systems", "kinematics"],
        "scraped_at": datetime.utcnow().isoformat(),
        "verified":   True,
    }


async def seed():
    print(f"\n🤖 Seeding {len(ROBOTICS_QUESTIONS)} curated robotics questions...")
    easy = sum(1 for q in ROBOTICS_QUESTIONS if q["difficulty"] == "easy")
    medium = sum(1 for q in ROBOTICS_QUESTIONS if q["difficulty"] == "medium")
    hard = sum(1 for q in ROBOTICS_QUESTIONS if q["difficulty"] == "hard")
    print(f"   Easy: {easy} | Medium: {medium} | Hard: {hard}")

    mongo = AsyncIOMotorClient(MONGO_URL)
    col = mongo[DB_NAME][COLLECTION]

    saved = 0
    skipped = 0
    for item in ROBOTICS_QUESTIONS:
        doc = _make_doc(item)
        exists = await col.find_one(
            {"question": {"$regex": f"^{re.escape(doc['question'][:50])}"}}
        )
        if exists:
            skipped += 1
            continue
        await col.insert_one(doc)
        saved += 1

    total_robotics = await col.count_documents({"domain": "robotics"})
    print(f"\n💾 Saved: {saved} new | Skipped (duplicates): {skipped}")
    print(f"🗄️  Total robotics questions now in MongoDB: {total_robotics}")
    mongo.close()


if __name__ == "__main__":
    asyncio.run(seed())
