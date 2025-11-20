import React, { useEffect, useState, useRef } from 'react';
import * as echarts from 'echarts';
import { FaDollarSign, FaUtensils, FaTable, FaTags, FaFileExport } from "react-icons/fa";
import { FaUsers, FaClock, FaFire, FaChair, FaCheckCircle, FaTimesCircle, FaCalendarCheck } from "react-icons/fa";
import axiosInstance from '../../../utils/axiosInstance';
import { apiUrl } from '../../../utils/config';

const Dashboard = () => {
    // Refs for chart containers
    const categoryChartRef = useRef(null);
    const shareChartRef = useRef(null);
    const timelineChartRef = useRef(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await axiosInstance.get(
                    `${apiUrl}/reports/dashboard`
                );
                if (data.success) {
                    console.log("Dashboard data fetched:", data.data);
                    setDashboardData(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // KPI and Card data based on API response
    const kpis = [
        {
            title: "Total Sessions",
            value: dashboardData?.overview?.total_sessions || 0,
            trend: "Current day sessions",
            trendColor: "text-success",
            icon: <FaUsers />,
            bg: "bg-primary-subtle",
            iconColor: "text-primary",
        },
        {
            title: "Total Orders",
            value: dashboardData?.overview?.total_orders || 0,
            trend: "Today's orders",
            trendColor: "text-info",
            icon: <FaUtensils />,
            bg: "bg-info-subtle",
            iconColor: "text-info",
        },
    ];

    const cards = [
        {
            title: "Total Revenue",
            value: dashboardData?.overview?.total_revenue
                ? `$${parseFloat(dashboardData.overview.total_revenue).toFixed(2)}`
                : "$0.00",
            icon: <FaDollarSign />,
            bg: "bg-success-subtle",
            iconColor: "text-success",
        },
        {
            title: "Available Tables",
            value: `${dashboardData?.tables?.available_tables || 0}/${dashboardData?.tables?.total_tables || 0}`,
            icon: <FaCheckCircle />,
            bg: "bg-primary-subtle",
            iconColor: "text-primary",
        },
        {
            title: "Occupied Tables",
            value: dashboardData?.tables?.occupied_tables || 0,
            icon: <FaChair />,
            bg: "bg-warning-subtle",
            iconColor: "text-warning",
        },
        {
            title: "Reserved Tables",
            value: dashboardData?.tables?.reserved_tables || 0,
            icon: <FaCalendarCheck />,
            bg: "bg-info-subtle",
            iconColor: "text-info",
        },
    ];

    // Initialize charts with real data
    useEffect(() => {
        if (!dashboardData) return;

        const initCharts = () => {
            // Initialize Category Chart
            const categoryChart = echarts.init(categoryChartRef.current);
            const categoryData = dashboardData.categoryRevenue || [];
            categoryChart.setOption({
                animation: false,
                grid: { top: 20, right: 20, bottom: 40, left: 60 },
                xAxis: {
                    type: 'category',
                    data: categoryData.length > 0
                        ? categoryData.map(item => item.category) // Fixed: Changed from category_name to category
                        : ['No Data'],
                    axisLine: { lineStyle: { color: '#e5e7eb' } },
                    axisTick: { show: false }
                },
                yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { lineStyle: { color: '#f3f4f6' } }
                },
                series: [{
                    data: categoryData.length > 0
                        ? categoryData.map(item => parseFloat(item.revenue))
                        : [0],
                    type: 'bar',
                    itemStyle: {
                        color: 'rgba(87, 181, 231, 1)',
                        borderRadius: [4, 4, 0, 0]
                    },
                    barWidth: '60%'
                }],
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderColor: '#e5e7eb',
                    textStyle: { color: '#1f2937' },
                    formatter: function (params) {
                        if (categoryData.length === 0) return 'No Data Available';
                        return `${params[0].name}: $${params[0].value}`;
                    }
                }
            });

            // Initialize Share Chart - Using table status data
            const shareChart = echarts.init(shareChartRef.current);
            const tableStatusData = dashboardData.tables ? [
                {
                    value: dashboardData.tables.available_tables,
                    name: 'Available Tables',
                    itemStyle: { color: 'rgba(141, 211, 199, 1)' }
                },
                {
                    value: dashboardData.tables.occupied_tables,
                    name: 'Occupied Tables',
                    itemStyle: { color: 'rgba(252, 141, 98, 1)' }
                },
                {
                    value: dashboardData.tables.reserved_tables,
                    name: 'Reserved Tables',
                    itemStyle: { color: 'rgba(251, 191, 114, 1)' }
                }
            ] : [];

            shareChart.setOption({
                animation: false,
                series: [{
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['50%', '50%'],
                    data: tableStatusData.length > 0 ? tableStatusData : [{ value: 1, name: 'No Data', itemStyle: { color: '#eee' } }],
                    itemStyle: { borderRadius: 8 },
                    label: {
                        show: true,
                        formatter: '{b}: {c}'
                    },
                    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
                }],
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderColor: '#e5e7eb',
                    textStyle: { color: '#1f2937' }
                }
            });

            // Initialize Timeline Chart with hourly revenue
            const timelineChart = echarts.init(timelineChartRef.current);
            const hourlyData = dashboardData.hourlyRevenue || [];
            // Create an array for all 24 hours with default revenue of 0
            const allHours = Array.from({ length: 24 }, (_, i) => {
                const hourData = hourlyData.find(item => parseInt(item.hour) === i);
                return hourData ? parseFloat(hourData.revenue) : 0;
            });

            timelineChart.setOption({
                animation: false,
                grid: { top: 20, right: 20, bottom: 40, left: 60 },
                xAxis: {
                    type: 'category',
                    data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                    axisLine: { lineStyle: { color: '#e5e7eb' } },
                    axisTick: { show: false }
                },
                yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { lineStyle: { color: '#f3f4f6' } }
                },
                series: [{
                    data: allHours,
                    type: 'line',
                    smooth: true,
                    lineStyle: { color: 'rgba(251, 191, 114, 1)', width: 3 },
                    itemStyle: { color: 'rgba(251, 191, 114, 1)' },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(251, 191, 114, 0.1)' },
                                { offset: 1, color: 'rgba(251, 191, 114, 0.01)' }
                            ]
                        }
                    },
                    showSymbol: false
                }],
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderColor: '#e5e7eb',
                    textStyle: { color: '#1f2937' },
                    formatter: function (params) {
                        const hour = params[0].axisValue;
                        const revenue = params[0].data;
                        return `Hour: ${hour}<br/>Revenue: $${revenue.toFixed(2)}`;
                    }
                }
            });

            // Resize charts when window resizes
            const handleResize = () => {
                categoryChart.resize();
                shareChart.resize();
                timelineChart.resize();
            };
            window.addEventListener('resize', handleResize);
            return () => {
                window.removeEventListener('resize', handleResize);
                categoryChart.dispose();
                shareChart.dispose();
                timelineChart.dispose();
            };
        };

        // Wait for the DOM to be fully loaded before initializing charts
        const timer = setTimeout(initCharts, 100);
        return () => clearTimeout(timer);
    }, [dashboardData]);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    if (!dashboardData) return (
        <div className="alert alert-warning mt-3" role="alert">
            No data available for the dashboard.
        </div>
    );

    return (
        <div className="p-3">
            <div className="">
                <div className="">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h1 className="fs-3 fw-bold text-dark">Dashboard Overview</h1>
                        <div className="text-muted small">
                            Date: {dashboardData.date || new Date().toISOString().split('T')[0]}
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="row g-4 mb-3 mt-1">
                        {kpis.map((item, idx) => (
                            <div key={idx} className="col-md-6">
                                <div className="card p-4 rounded shadow-sm bg-white h-100 border-0">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="small text-muted mb-1">{item.title}</p>
                                            <h4 className="fw-bold mb-1">{item.value}</h4>
                                            <div className={`small fw-medium ${item.trendColor}`}>
                                                {item.trend}
                                            </div>
                                        </div>
                                        <div
                                            className={`rounded-circle d-flex align-items-center justify-content-center ${item.bg}`}
                                            style={{ width: "36px", height: "36px" }}
                                        >
                                            <span className={`${item.iconColor} fs-5`}>{item.icon}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Revenue Summary Cards */}
                    <div className="row g-4 mb-3">
                        {cards.map((card, index) => (
                            <div key={index} className="col-md-3">
                                <div className="card shadow-sm border-0 rounded-4 h-100">
                                    <div className="card-body d-flex justify-content-between align-items-center">
                                        <div>
                                            <p className="mb-1 text-muted small">{card.title}</p>
                                            <h5 className="fw-bold mb-0">{card.value}</h5>
                                        </div>
                                        <div
                                            className={`rounded-circle d-flex align-items-center justify-content-center ${card.bg}`}
                                            style={{ width: "36px", height: "36px" }}
                                        >
                                            <span className={`${card.iconColor} fs-5`}>{card.icon}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Report Display Area */}
                    <div className="row mb-4">
                        <div className="col-md-6 mb-3">
                            <div className="bg-white p-4 rounded shadow-sm border h-100">
                                <h3 className="h5 font-weight-semibold mb-3">Revenue by Category</h3>
                                <div ref={categoryChartRef} style={{ height: '300px', width: '100%' }}></div>
                            </div>
                        </div>
                        <div className="col-md-6 mb-3">
                            <div className="bg-white p-4 rounded shadow-sm border h-100">
                                <h3 className="h5 font-weight-semibold mb-3">Table Status</h3>
                                <div ref={shareChartRef} style={{ height: '300px', width: '100%' }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="row mb-4">
                        <div className="col-md-12">
                            <div className="bg-white p-4 rounded shadow-sm border h-100">
                                <h3 className="h5 font-weight-semibold mb-3">Hourly Revenue</h3>
                                <div ref={timelineChartRef} style={{ height: '300px', width: '100%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;