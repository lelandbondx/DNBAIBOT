import streamlit as st
import streamlit.components.v1 as components

# Set up the page to take up the full screen
st.set_page_config(page_title="LEE'S ROBO TUNES", layout="wide", initial_sidebar_state="collapsed")

# Read the single compiled React application
with open("dist/index.html", "r", encoding="utf-8") as f:
    html_data = f.read()

# Render the application
components.html(html_data, height=1200, scrolling=True)
