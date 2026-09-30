import torch
import torch.nn as nn
import torch.nn.functional as F

class CraterNet(nn.Module):
    """
    CraterNet: Deep Convolutional Neural Network designed for 
    Planetary Surface Geological Feature & Crater Classification.
    Accepts 3x128x128 image patches.
    Outputs: Binary logits (0: Non-Crater, 1: Crater).
    """
    def __init__(self, in_channels: int = 3, num_classes: int = 2):
        super(CraterNet, self).__init__()
        
        # Block 1: Low-level edge and radial gradient extraction
        self.conv1 = nn.Conv2d(in_channels, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.pool1 = nn.MaxPool2d(2, 2)  # 64x64
        
        # Block 2: Crater rim curvature and circular shadow feature mapping
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.pool2 = nn.MaxPool2d(2, 2)  # 32x32
        
        # Block 3: Complex planetary topography and ejecta blanket representation
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.pool3 = nn.MaxPool2d(2, 2)  # 16x16
        
        # Block 4: High-level geological structure discrimination
        self.conv4 = nn.Conv2d(128, 256, kernel_size=3, padding=1)
        self.bn4 = nn.BatchNorm2d(256)
        self.pool4 = nn.MaxPool2d(2, 2)  # 8x8
        
        self.drop_conv = nn.Dropout2d(0.25)
        self.adaptive_pool = nn.AdaptiveAvgPool2d((4, 4))
        
        # Classification Head
        self.classifier = nn.Sequential(
            nn.Linear(256 * 4 * 4, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.4),
            nn.Linear(256, 64),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(64, num_classes)
        )
        
        self._initialize_weights()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.pool1(F.leaky_relu(self.bn1(self.conv1(x)), 0.1))
        x = self.pool2(F.leaky_relu(self.bn2(self.conv2(x)), 0.1))
        x = self.pool3(F.leaky_relu(self.bn3(self.conv3(x)), 0.1))
        x = self.pool4(F.leaky_relu(self.bn4(self.conv4(x)), 0.1))
        x = self.drop_conv(x)
        
        x = self.adaptive_pool(x)
        x = torch.flatten(x, 1)
        logits = self.classifier(x)
        return logits

    def _initialize_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='leaky_relu')
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.BatchNorm2d) or isinstance(m, nn.BatchNorm1d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.normal_(m.weight, 0, 0.01)
                nn.init.constant_(m.bias, 0)

def build_crater_model(weights_path: str = None) -> CraterNet:
    model = CraterNet()
    if weights_path and torch.cuda.is_available():
        device = torch.device('cuda')
    else:
        device = torch.device('cpu')
        
    if weights_path and torch.os.path.exists(weights_path):
        state_dict = torch.load(weights_path, map_location=device)
        model.load_state_dict(state_dict)
    
    model.eval()
    return model
