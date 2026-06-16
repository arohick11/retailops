# AWS Provider configuration using variables
provider "aws" {
  region = var.aws_region
}

# Fetch available Availability Zones dynamically in the selected region
data "aws_availability_zones" "available" {
  state = "available"
}

# ==============================================================================
# VPC & NETWORKING RESOURCES
# ==============================================================================

# Main VPC for RetailOps network isolation
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${var.cluster_name}-vpc"
    Environment = var.environment
  }
}

# Internet Gateway to route public traffic (e.g. Ingress/Load Balancers)
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.cluster_name}-igw"
  }
}

# Public Subnets (placed in 2 different Availability Zones for High Availability)
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, 1)
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name                                        = "${var.cluster_name}-public-1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                    = "1" # Required by K8s ALB Controller to locate public subnets
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, 2)
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name                                        = "${var.cluster_name}-public-2"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                    = "1"
  }
}

# Private Subnets (where EKS Worker Nodes and database containers reside securely)
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 11)
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name                                        = "${var.cluster_name}-private-1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"           = "1" # Required by K8s Controller to locate private subnets
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 12)
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name                                        = "${var.cluster_name}-private-2"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"           = "1"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
  depends_on = [aws_internet_gateway.igw]

  tags = {
    Name = "${var.cluster_name}-nat-eip"
  }
}

# NAT Gateway allowing resources in private subnets (EKS nodes) to securely access the internet (e.g. pull Docker Hub images)
resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_1.id

  tags = {
    Name = "${var.cluster_name}-nat"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "${var.cluster_name}-public-rt"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  tags = {
    Name = "${var.cluster_name}-private-rt"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private.id
}


# ==============================================================================
# IAM ROLES (Access Controls & Security)
# ==============================================================================

# IAM Role for EKS Cluster Control Plane
resource "aws_iam_role" "cluster" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "cluster_EKSClusterPolicy" {
  policy_arn = "arn:aws:iam:aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.cluster.name
}

# IAM Role for Managed Worker Node Groups
resource "aws_iam_role" "nodes" {
  name = "${var.cluster_name}-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "nodes_AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam:aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.nodes.name
}

resource "aws_iam_role_policy_attachment" "nodes_AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam:aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.nodes.name
}

resource "aws_iam_role_policy_attachment" "nodes_AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam:aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.nodes.name
}


# ==============================================================================
# EKS CLUSTER & NODE GROUP
# ==============================================================================

# EKS Cluster Resource (Managed Kubernetes Master Nodes)
resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  role_arn = aws_iam_role.cluster.arn

  vpc_config {
    # Place cluster endpoints across subnets
    subnet_ids = [
      aws_subnet.public_1.id,
      aws_subnet.public_2.id,
      aws_subnet.private_1.id,
      aws_subnet.private_2.id
    ]
  }

  depends_on = [
    aws_iam_role_policy_attachment.cluster_EKSClusterPolicy
  ]
}

# EKS Managed Node Group (Worker Nodes to host containers)
resource "aws_eks_node_group" "nodes" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-worker-nodes"
  node_role_arn   = aws_iam_role.nodes.arn

  # Nodes are securely placed inside Private Subnets
  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id
  ]

  # Node sizing parameters optimized for a lightweight demo-scale cluster
  scaling_config {
    desired_size = 2
    max_size     = 3
    min_size     = 1
  }

  # Instance type selection
  instance_types = ["t3.medium"]

  depends_on = [
    aws_iam_role_policy_attachment.nodes_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.nodes_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.nodes_AmazonEC2ContainerRegistryReadOnly
  ]

  tags = {
    Environment = var.environment
  }
}
