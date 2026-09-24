import React from 'react';
import { Container, Form, InputGroup } from 'react-bootstrap';
import NotificationBanner from '../NotificationBanner';

interface AppHeaderProps {
  onMenuClick: () => void;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onMenuClick, onSearch, showSearch = true }) => {
  const [search, setSearch] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && search.trim()) {
      onSearch(search.trim());
    }
  };

  return (
    <div className="sticky-search-header">
      <Container className="py-3">
        <div className="d-flex align-items-center gap-3">
          {/* Menu Icon */}
          <button className="header-icon-btn menu-btn" onClick={onMenuClick}>
            ☰
          </button>

          {/* Search Bar */}
          {showSearch && (
            <div className="flex-grow-1">
              <Form onSubmit={handleSearch}>
                <InputGroup className="search-input-wrapper">
                  <InputGroup.Text className="search-icon">
                    🔍
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search destinations, events, guides..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                  />
                </InputGroup>
              </Form>
            </div>
          )}

          {/* Notification Banner */}
          <NotificationBanner />

          {/* Profile Icon */}
          <button className="header-icon-btn profile-btn">
            👤
          </button>
        </div>
      </Container>
    </div>
  );
};

export default AppHeader;
