-- DeviceVendor Many-to-Many Relationship Schema Update
-- This script converts the 1:1 Device-Vendor relationship to many-to-many

-- Step 1: Create DeviceVendor junction table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DeviceVendor')
BEGIN
    CREATE TABLE DeviceVendor (
        DeviceVendorId INT IDENTITY(1,1) PRIMARY KEY,
        DeviceId INT NOT NULL,
        VendorId INT NOT NULL,
        AssignedDate DATETIME2 NOT NULL DEFAULT GETDATE(),
        IsActive BIT NOT NULL DEFAULT 1,
        AssignedBy NVARCHAR(100),
        Notes NVARCHAR(500),
        
        CONSTRAINT FK_DeviceVendor_Device FOREIGN KEY (DeviceId) REFERENCES Device(DeviceId) ON DELETE CASCADE,
        CONSTRAINT FK_DeviceVendor_Vendor FOREIGN KEY (VendorId) REFERENCES Vendor(VendorId) ON DELETE CASCADE,
        CONSTRAINT UQ_DeviceVendor_Active UNIQUE (DeviceId, VendorId, IsActive)
    );
    
    CREATE INDEX IX_DeviceVendor_DeviceId ON DeviceVendor(DeviceId);
    CREATE INDEX IX_DeviceVendor_VendorId ON DeviceVendor(VendorId);
    CREATE INDEX IX_DeviceVendor_IsActive ON DeviceVendor(IsActive);
    
    PRINT 'DeviceVendor table created successfully';
END
ELSE
    PRINT 'DeviceVendor table already exists';

-- Step 2: Drop index and VendorId column from Device table
IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('Device') AND name = 'IX_Device_VendorId')
BEGIN
    DROP INDEX IX_Device_VendorId ON Device;
    PRINT 'IX_Device_VendorId index dropped';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Device') AND name = 'VendorId')
BEGIN
    ALTER TABLE Device DROP COLUMN VendorId;
    PRINT 'VendorId column dropped from Device table';
END
ELSE
    PRINT 'VendorId column does not exist in Device table';

-- Step 3: Add constraint to ensure DeviceType compatibility
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_DeviceVendor_DeviceType_Match')
BEGIN
    ALTER TABLE DeviceVendor 
    ADD CONSTRAINT CK_DeviceVendor_DeviceType_Match 
    CHECK (
        NOT EXISTS (
            SELECT 1 
            FROM Device d 
            INNER JOIN Vendor v ON DeviceVendor.DeviceId = d.DeviceId AND DeviceVendor.VendorId = v.VendorId
            WHERE d.DeviceType != v.DeviceType
        )
    );
    PRINT 'DeviceType compatibility constraint added';
END
ELSE
    PRINT 'DeviceType compatibility constraint already exists';

PRINT 'Schema update completed successfully';