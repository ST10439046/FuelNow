import React, {
    useEffect,
    useState,
  } from 'react';
  
  import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
  } from 'react-native';
  
  import {
    SafeAreaView,
  } from 'react-native-safe-area-context';
  
  import * as ImagePicker from 'expo-image-picker';
  
  import * as DocumentPicker from 'expo-document-picker';
  
  import {
    Feather,
  } from '@expo/vector-icons';
  
  import {
    useDesignMode,
  } from '../../context/DesignModeContext';
  
  import {
    driverRepository,
    DriverDocumentModel,
  } from '../../repositories/DriverRepository';
  
  
  const DOCUMENT_TYPES =
    [
      "Driver's Licence",
      'Professional Driving Permit',
      'Vehicle Licence',
      'Roadworthy Certificate',
      'Hazmat Certificate',
    ];
  
  
  function formatDate(
    value: string
  ): string {
    if (!value) {
      return 'Not set';
    }
  
    const date =
      new Date(value);
  
    return date.toLocaleDateString(
      'en-ZA',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  }
  
  
  function getDocumentIcon(
    mimeType: string | null
  ) {
    if (
      mimeType?.startsWith(
        'image/'
      )
    ) {
      return 'image';
    }
  
    return 'file-text';
  }
  
  
  export default function ComplianceDocumentsScreen({
    navigation,
  }: any) {
    const {
      colors,
      font,
      isWireframe,
    } =
      useDesignMode();
  
    const [
      documents,
      setDocuments,
    ] =
      useState<
        DriverDocumentModel[]
      >([]);
  
    const [
      loading,
      setLoading,
    ] =
      useState(true);
  
    const [
      saving,
      setSaving,
    ] =
      useState(false);
  
    const [
      modalVisible,
      setModalVisible,
    ] =
      useState(false);
  
    const [
      documentType,
      setDocumentType,
    ] =
      useState(
        DOCUMENT_TYPES[0]
      );
  
    const [
      documentNumber,
      setDocumentNumber,
    ] =
      useState('');
  
    const [
      issueDate,
      setIssueDate,
    ] =
      useState('');
  
    const [
      expiryDate,
      setExpiryDate,
    ] =
      useState('');
  
    const [
      selectedFile,
      setSelectedFile,
    ] =
      useState<{
        uri: string;
        name: string;
        mimeType: string;
        size?: number;
      } | null>(null);
  
  
    const loadDocuments =
      async () => {
        try {
          setLoading(true);
  
          const result =
            await driverRepository
              .getDriverDocuments();
  
          setDocuments(result);
        } catch (error) {
          console.error(
            'ComplianceDocumentsScreen: failed to load documents',
            error
          );
        } finally {
          setLoading(false);
        }
      };
  
  
    useEffect(() => {
      loadDocuments();
    }, []);
  
  
    const resetForm =
      () => {
        setDocumentType(
          DOCUMENT_TYPES[0]
        );
  
        setDocumentNumber('');
  
        setIssueDate('');
  
        setExpiryDate('');
  
        setSelectedFile(null);
      };
  
  
    const closeModal =
      () => {
        if (saving) {
          return;
        }
  
        resetForm();
  
        setModalVisible(false);
      };
  
  
    const pickImage =
      async () => {
        const permission =
          await ImagePicker
            .requestMediaLibraryPermissionsAsync();
  
        if (
          !permission.granted
        ) {
          Alert.alert(
            'Permission required',
            'FuelNow needs access to your photos to select a compliance document.'
          );
  
          return;
        }
  
        const result =
          await ImagePicker
            .launchImageLibraryAsync({
              mediaTypes:
                ['images'],
              quality: 0.9,
              allowsEditing: false,
            });
  
        if (
          result.canceled ||
          !result.assets?.length
        ) {
          return;
        }
  
        const asset =
          result.assets[0];
  
        setSelectedFile({
          uri:
            asset.uri,
  
          name:
            asset.fileName ||
            `document-${Date.now()}.jpg`,
  
          mimeType:
            asset.mimeType ||
            'image/jpeg',
  
          size:
            asset.fileSize,
        });
      };
  
  
    const pickPdf =
      async () => {
        const result =
          await DocumentPicker
            .getDocumentAsync({
              type:
                'application/pdf',
  
              copyToCacheDirectory:
                true,
  
              multiple:
                false,
            });
  
        if (
          result.canceled ||
          !result.assets?.length
        ) {
          return;
        }
  
        const asset =
          result.assets[0];
  
        setSelectedFile({
          uri:
            asset.uri,
  
          name:
            asset.name,
  
          mimeType:
            asset.mimeType ||
            'application/pdf',
  
          size:
            asset.size,
        });
      };
  
  
    const saveDocument =
      async () => {
        if (
          !documentNumber.trim()
        ) {
          Alert.alert(
            'Missing information',
            'Enter the document number.'
          );
  
          return;
        }
  
        if (
          !issueDate.trim() ||
          !expiryDate.trim()
        ) {
          Alert.alert(
            'Missing information',
            'Enter the issue date and expiry date.'
          );
  
          return;
        }
  
        if (!selectedFile) {
          Alert.alert(
            'File required',
            'Select a PDF or image of the compliance document.'
          );
  
          return;
        }
  
        try {
          setSaving(true);
  
          await driverRepository
            .createComplianceDocument({
              documentType:
                documentType as DriverDocumentModel['type'],
  
              documentNumber:
                documentNumber.trim(),
  
              issueDate:
                issueDate.trim(),
  
              expiryDate:
                expiryDate.trim(),
  
              fileUri:
                selectedFile.uri,
  
              fileName:
                selectedFile.name,
  
              mimeType:
                selectedFile.mimeType,
  
              fileSize:
                selectedFile.size ??
                null,
            });
  
          closeModal();
  
          await loadDocuments();
  
          Alert.alert(
            'Document uploaded',
            'The compliance document has been added successfully.'
          );
        } catch (error: any) {
          console.error(
            'ComplianceDocumentsScreen: upload failed',
            error
          );
  
          Alert.alert(
            'Upload failed',
            error?.message ||
              'The compliance document could not be uploaded.'
          );
        } finally {
          setSaving(false);
        }
      };
  
  
    const deleteDocument =
      (document: DriverDocumentModel) => {
        Alert.alert(
          'Delete document',
          `Delete ${document.type}? This will also remove the uploaded file.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
  
            {
              text: 'Delete',
              style: 'destructive',
  
              onPress:
                async () => {
                  try {
                    await driverRepository
                      .deleteComplianceDocument(
                        document.id
                      );
  
                    await loadDocuments();
                  } catch (error: any) {
                    Alert.alert(
                      'Delete failed',
                      error?.message ||
                        'The document could not be deleted.'
                    );
                  }
                },
            },
          ]
        );
      };
  
  
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor:
              colors.warmAsh,
          },
        ]}
        edges={[
          'top',
          'left',
          'right',
        ]}
      >
        <View
          style={[
            styles.root,
            {
              backgroundColor:
                colors.warmAsh,
            },
          ]}
        >
          <View
            style={[
              styles.header,
              {
                borderBottomColor:
                  colors.divider,
              },
            ]}
          >
            <Pressable
              onPress={() =>
                navigation.goBack()
              }
              style={styles.backButton}
            >
              <Feather
                name="arrow-left"
                size={22}
                color={
                  colors.charcoalInk
                }
              />
            </Pressable>
  
            <View
              style={styles.headerCenter}
            >
              <Text
                style={[
                  styles.headerTitle,
                  {
                    color:
                      colors.charcoalInk,
                    fontFamily:
                      font(
                        'displayBold'
                      ),
                  },
                ]}
              >
                Compliance
              </Text>
  
              <Text
                style={[
                  styles.headerSubtitle,
                  {
                    color:
                      colors.inkLight,
                    fontFamily:
                      font('body'),
                  },
                ]}
              >
                Driver documents
              </Text>
            </View>
  
            <View
              style={
                styles.headerSpacer
              }
            />
          </View>
  
  
          <ScrollView
            contentContainerStyle={
              styles.content
            }
            showsVerticalScrollIndicator={
              false
            }
          >
            <View
              style={[
                styles.infoBanner,
                {
                  backgroundColor:
                    isWireframe
                      ? colors.ashDark
                      : '#FFF7ED',
                  borderColor:
                    isWireframe
                      ? colors.divider
                      : '#FED7AA',
                },
              ]}
            >
              <Feather
                name="shield"
                size={20}
                color={
                  isWireframe
                    ? colors.inkLight
                    : '#F97316'
                }
              />
  
              <Text
                style={[
                  styles.infoBannerText,
                  {
                    color:
                      colors.charcoalInk,
                    fontFamily:
                      font('body'),
                  },
                ]}
              >
                Keep your licence,
                permits and vehicle
                documents up to date.
              </Text>
            </View>
  
  
            <Pressable
              onPress={() =>
                setModalVisible(true)
              }
              style={[
                styles.addButton,
                {
                  backgroundColor:
                    isWireframe
                      ? colors.charcoalInk
                      : '#F97316',
                },
              ]}
            >
              <Feather
                name="plus"
                size={19}
                color="#FFFFFF"
              />
  
              <Text
                style={[
                  styles.addButtonText,
                  {
                    fontFamily:
                      font('bodyBold'),
                  },
                ]}
              >
                Add Document
              </Text>
            </Pressable>
  
  
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    colors.charcoalInk,
                  fontFamily:
                    font(
                      'displayBold'
                    ),
                },
              ]}
            >
              Your Documents
            </Text>
  
  
            {loading ? (
              <View
                style={
                  styles.loading
                }
              >
                <ActivityIndicator
                  color={
                    isWireframe
                      ? colors.inkLight
                      : '#F97316'
                  }
                />
              </View>
            ) : documents.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor:
                      colors.cardBg,
                    borderColor:
                      colors.divider,
                  },
                ]}
              >
                <Feather
                  name="file-text"
                  size={36}
                  color={
                    colors.inkFaint
                  }
                />
  
                <Text
                  style={[
                    styles.emptyTitle,
                    {
                      color:
                        colors.charcoalInk,
                      fontFamily:
                        font(
                          'bodyMedium'
                        ),
                    },
                  ]}
                >
                  No documents uploaded
                </Text>
  
                <Text
                  style={[
                    styles.emptyText,
                    {
                      color:
                        colors.inkLight,
                      fontFamily:
                        font('body'),
                    },
                  ]}
                >
                  Add your compliance
                  documents to keep your
                  driver profile up to date.
                </Text>
              </View>
            ) : (
              documents.map(
                (document) => (
                  <View
                    key={
                      document.id
                    }
                    style={[
                      styles.documentCard,
                      {
                        backgroundColor:
                          colors.cardBg,
                        borderColor:
                          colors.divider,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.documentIcon,
                        {
                          backgroundColor:
                            document.isExpired
                              ? '#FEE2E2'
                              : document.isExpiringSoon
                                ? '#FEF9C3'
                                : '#DCFCE7',
                        },
                      ]}
                    >
                      <Feather
                        name={
                          getDocumentIcon(
                            document.fileMimeType
                          ) as any
                        }
                        size={20}
                        color={
                          document.isExpired
                            ? '#DC2626'
                            : document.isExpiringSoon
                              ? '#854D0E'
                              : '#16A34A'
                        }
                      />
                    </View>
  
                    <View
                      style={
                        styles.documentCenter
                      }
                    >
                      <Text
                        style={[
                          styles.documentType,
                          {
                            color:
                              colors.charcoalInk,
                            fontFamily:
                              font(
                                'bodyBold'
                              ),
                          },
                        ]}
                      >
                        {document.type}
                      </Text>
  
                      <Text
                        style={[
                          styles.documentNumber,
                          {
                            color:
                              colors.inkLight,
                            fontFamily:
                              font('body'),
                          },
                        ]}
                      >
                        {document.number}
                      </Text>
  
                      <Text
                        style={[
                          styles.documentExpiry,
                          {
                            color:
                              document.isExpired
                                ? '#DC2626'
                                : colors.inkFaint,
                            fontFamily:
                              font('body'),
                          },
                        ]}
                      >
                        Expires:{' '}
                        {formatDate(
                          document.expiryDate
                        )}
                      </Text>
  
                      {document.fileName ? (
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.fileName,
                            {
                              color:
                                colors.inkFaint,
                              fontFamily:
                                font('body'),
                            },
                          ]}
                        >
                          {document.fileName}
                        </Text>
                      ) : null}
                    </View>
  
                    <Pressable
                      onPress={() =>
                        deleteDocument(
                          document
                        )
                      }
                      style={
                        styles.deleteButton
                      }
                    >
                      <Feather
                        name="trash-2"
                        size={18}
                        color="#DC2626"
                      />
                    </Pressable>
                  </View>
                )
              )
            )}
          </ScrollView>
  
  
          <Modal
            visible={
              modalVisible
            }
            animationType="slide"
            transparent
            onRequestClose={
              closeModal
            }
          >
            <View
              style={
                styles.modalOverlay
              }
            >
              <View
                style={[
                  styles.modalCard,
                  {
                    backgroundColor:
                      colors.cardBg,
                  },
                ]}
              >
                <View
                  style={
                    styles.modalHeader
                  }
                >
                  <Text
                    style={[
                      styles.modalTitle,
                      {
                        color:
                          colors.charcoalInk,
                        fontFamily:
                          font(
                            'displayBold'
                          ),
                      },
                    ]}
                  >
                    Add Document
                  </Text>
  
                  <Pressable
                    onPress={
                      closeModal
                    }
                    disabled={saving}
                  >
                    <Feather
                      name="x"
                      size={23}
                      color={
                        colors.inkLight
                      }
                    />
                  </Pressable>
                </View>
  
  
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                >
                  <Text
                    style={[
                      styles.label,
                      {
                        color:
                          colors.charcoalInk,
                        fontFamily:
                          font(
                            'bodyMedium'
                          ),
                      },
                    ]}
                  >
                    Document Type
                  </Text>
  
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                      false
                    }
                    style={
                      styles.typeScroll
                    }
                  >
                    {DOCUMENT_TYPES.map(
                      (type) => (
                        <Pressable
                          key={type}
                          onPress={() =>
                            setDocumentType(
                              type
                            )
                          }
                          style={[
                            styles.typeChip,
                            {
                              backgroundColor:
                                documentType ===
                                type
                                  ? isWireframe
                                    ? colors.charcoalInk
                                    : '#F97316'
                                  : colors.warmAsh,
  
                              borderColor:
                                colors.divider,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeChipText,
                              {
                                color:
                                  documentType ===
                                  type
                                    ? '#FFFFFF'
                                    : colors.charcoalInk,
                                fontFamily:
                                  font(
                                    'bodyMedium'
                                  ),
                              },
                            ]}
                          >
                            {type}
                          </Text>
                        </Pressable>
                      )
                    )}
                  </ScrollView>
  
  
                  <Text
                    style={[
                      styles.label,
                      {
                        color:
                          colors.charcoalInk,
                        fontFamily:
                          font(
                            'bodyMedium'
                          ),
                      },
                    ]}
                  >
                    Document Number
                  </Text>
  
                  <TextInput
                    value={
                      documentNumber
                    }
                    onChangeText={
                      setDocumentNumber
                    }
                    placeholder="e.g. DL-KZN-123456"
                    placeholderTextColor={
                      colors.inkFaint
                    }
                    style={[
                      styles.input,
                      {
                        color:
                          colors.charcoalInk,
                        borderColor:
                          colors.divider,
                        backgroundColor:
                          colors.warmAsh,
                        fontFamily:
                          font('body'),
                      },
                    ]}
                  />
  
  
                  <Text
                    style={[
                      styles.label,
                      {
                        color:
                          colors.charcoalInk,
                        fontFamily:
                          font(
                            'bodyMedium'
                          ),
                      },
                    ]}
                  >
                    Issue Date
                  </Text>
  
                  <TextInput
                    value={
                      issueDate
                    }
                    onChangeText={
                      setIssueDate
                    }
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={
                      colors.inkFaint
                    }
                    style={[
                      styles.input,
                      {
                        color:
                          colors.charcoalInk,
                        borderColor:
                          colors.divider,
                        backgroundColor:
                          colors.warmAsh,
                        fontFamily:
                          font('body'),
                      },
                    ]}
                  />
  
  
                  <Text
                    style={[
                      styles.label,
                      {
                        color:
                          colors.charcoalInk,
                        fontFamily:
                          font(
                            'bodyMedium'
                          ),
                      },
                    ]}
                  >
                    Expiry Date
                  </Text>
  
                  <TextInput
                    value={
                      expiryDate
                    }
                    onChangeText={
                      setExpiryDate
                    }
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={
                      colors.inkFaint
                    }
                    style={[
                      styles.input,
                      {
                        color:
                          colors.charcoalInk,
                        borderColor:
                          colors.divider,
                        backgroundColor:
                          colors.warmAsh,
                        fontFamily:
                          font('body'),
                      },
                    ]}
                  />
  
  
                  <Text
                    style={[
                      styles.label,
                      {
                        color:
                          colors.charcoalInk,
                        fontFamily:
                          font(
                            'bodyMedium'
                          ),
                      },
                    ]}
                  >
                    Document File
                  </Text>
  
  
                  <View
                    style={
                      styles.fileButtons
                    }
                  >
                    <Pressable
                      onPress={
                        pickImage
                      }
                      style={[
                        styles.fileButton,
                        {
                          borderColor:
                            colors.divider,
                        },
                      ]}
                    >
                      <Feather
                        name="image"
                        size={18}
                        color={
                          isWireframe
                            ? colors.charcoalInk
                            : '#F97316'
                        }
                      />
  
                      <Text
                        style={[
                          styles.fileButtonText,
                          {
                            color:
                              colors.charcoalInk,
                            fontFamily:
                              font(
                                'bodyMedium'
                              ),
                          },
                        ]}
                      >
                        Image
                      </Text>
                    </Pressable>
  
  
                    <Pressable
                      onPress={
                        pickPdf
                      }
                      style={[
                        styles.fileButton,
                        {
                          borderColor:
                            colors.divider,
                        },
                      ]}
                    >
                      <Feather
                        name="file-text"
                        size={18}
                        color={
                          isWireframe
                            ? colors.charcoalInk
                            : '#F97316'
                        }
                      />
  
                      <Text
                        style={[
                          styles.fileButtonText,
                          {
                            color:
                              colors.charcoalInk,
                            fontFamily:
                              font(
                                'bodyMedium'
                              ),
                          },
                        ]}
                      >
                        PDF
                      </Text>
                    </Pressable>
                  </View>
  
  
                  {selectedFile ? (
                    <View
                      style={[
                        styles.selectedFile,
                        {
                          backgroundColor:
                            colors.warmAsh,
                          borderColor:
                            colors.divider,
                        },
                      ]}
                    >
                      <Feather
                        name="check-circle"
                        size={18}
                        color="#16A34A"
                      />
  
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.selectedFileText,
                          {
                            color:
                              colors.charcoalInk,
                            fontFamily:
                              font('body'),
                          },
                        ]}
                      >
                        {selectedFile.name}
                      </Text>
                    </View>
                  ) : null}
  
  
                  <Pressable
                    onPress={
                      saveDocument
                    }
                    disabled={
                      saving
                    }
                    style={[
                      styles.saveButton,
                      {
                        backgroundColor:
                          saving
                            ? colors.inkFaint
                            : isWireframe
                              ? colors.charcoalInk
                              : '#F97316',
                      },
                    ]}
                  >
                    {saving ? (
                      <ActivityIndicator
                        color="#FFFFFF"
                      />
                    ) : (
                      <>
                        <Feather
                          name="upload"
                          size={18}
                          color="#FFFFFF"
                        />
  
                        <Text
                          style={[
                            styles.saveButtonText,
                            {
                              fontFamily:
                                font(
                                  'bodyBold'
                                ),
                            },
                          ]}
                        >
                          Upload Document
                        </Text>
                      </>
                    )}
                  </Pressable>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    );
  }
  
  
  const styles =
    StyleSheet.create({
      safeArea: {
        flex: 1,
      },
  
      root: {
        flex: 1,
        height:
          Platform.OS === 'web'
            ? ('100vh' as any)
            : '100%',
      },
  
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth:
          StyleSheet.hairlineWidth,
      },
  
      backButton: {
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
      },
  
      headerCenter: {
        flex: 1,
        marginLeft: 6,
      },
  
      headerSpacer: {
        width: 42,
      },
  
      headerTitle: {
        fontSize: 21,
        fontWeight: '700',
      },
  
      headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
      },
  
      content: {
        padding: 16,
        paddingBottom: 40,
        gap: 12,
      },
  
      infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
      },
  
      infoBannerText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
      },
  
      addButton: {
        minHeight: 50,
        borderRadius: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      },
  
      addButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
      },
  
      sectionTitle: {
        fontSize: 17,
        marginTop: 10,
        marginBottom: 2,
      },
  
      loading: {
        paddingVertical: 40,
        alignItems: 'center',
      },
  
      emptyCard: {
        borderWidth: 1,
        borderRadius: 16,
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 24,
      },
  
      emptyTitle: {
        fontSize: 15,
        marginTop: 12,
      },
  
      emptyText: {
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center',
        marginTop: 6,
      },
  
      documentCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      },
  
      documentIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
      },
  
      documentCenter: {
        flex: 1,
        gap: 2,
      },
  
      documentType: {
        fontSize: 14,
      },
  
      documentNumber: {
        fontSize: 12,
      },
  
      documentExpiry: {
        fontSize: 11,
        marginTop: 2,
      },
  
      fileName: {
        fontSize: 10,
        marginTop: 2,
      },
  
      deleteButton: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
      },
  
      modalOverlay: {
        flex: 1,
        backgroundColor:
          'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
      },
  
      modalCard: {
        maxHeight: '92%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 24,
      },
  
      modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      },
  
      modalTitle: {
        fontSize: 20,
      },
  
      label: {
        fontSize: 13,
        marginTop: 12,
        marginBottom: 7,
      },
  
      typeScroll: {
        marginBottom: 2,
      },
  
      typeChip: {
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 9,
        marginRight: 8,
      },
  
      typeChipText: {
        fontSize: 12,
      },
  
      input: {
        minHeight: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 13,
        fontSize: 14,
      },
  
      fileButtons: {
        flexDirection: 'row',
        gap: 10,
      },
  
      fileButton: {
        flex: 1,
        minHeight: 48,
        borderWidth: 1,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
      },
  
      fileButtonText: {
        fontSize: 13,
      },
  
      selectedFile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderRadius: 12,
        padding: 11,
        marginTop: 10,
      },
  
      selectedFileText: {
        flex: 1,
        fontSize: 12,
      },
  
      saveButton: {
        minHeight: 50,
        borderRadius: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
      },
  
      saveButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
      },
    });